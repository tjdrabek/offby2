/**
 * Resolves source input into the millimetre values a layout is made of,
 * deriving at most one of them and refusing geometry that cannot be described.
 *
 * Validation (validateSheetLayoutInput.ts) answers "is every entry present and
 * readable"; derivation (deriveDimension.ts) answers "can the one absent
 * dimension be computed"; geometry validation (validateSheetGeometry.ts)
 * answers "is the resulting sheet possible". This module is the only place the
 * three are combined, and it keeps the joins deliberately narrow: derivation is
 * attempted only when a single empty dimensional field is the sole thing
 * standing in the way, and geometry is judged only once every value is in
 * millimetres, so a derived value is never presented while some other entry is
 * still wrong.
 *
 * A derived measurement carries `status: "derived"` and its disclosure rather
 * than a source text, so it stays distinguishable from an entered value
 * wherever it is shown or saved.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  MEASUREMENT_FIELDS,
  type CornerRadiusInput,
  type CountFieldId,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import type {
  CornerRadiusDisclosure,
  Millimetres,
  SheetGeometry,
} from "./SheetGeometry";
import type { ParsedMeasurement } from "./parseMeasurement";
import {
  validateSheetGeometry,
  type SheetGeometryRefusal,
} from "./validateSheetGeometry";
import {
  deriveMissingDimension,
  type SheetLayoutDerivation,
  type SheetLayoutDerivationResult,
} from "./deriveDimension";
import {
  validateSheetLayoutInput,
  type SheetLayoutIssue,
} from "./validateSheetLayoutInput";

/** A value the user typed, or the one value the sheet equation supplied. */
export interface DerivedMeasurement {
  status: "derived";
  valueMm: Millimetres;
  derivation: SheetLayoutDerivation;
}

export type ResolvedMeasurement = ParsedMeasurement | DerivedMeasurement;

export interface ResolvedSheetLayout {
  counts: Readonly<Record<CountFieldId, number>>;
  measurements: Readonly<Record<MeasurementFieldId, ResolvedMeasurement>>;
  /** Null for the zero and unknown corner-radius states, which carry no measurement. */
  cornerRadius: ParsedMeasurement | null;
  /** The single derived field, or null when every value was entered. */
  derivation: SheetLayoutDerivation | null;
  /** The same values as normalized geometry, judged and accepted. */
  geometry: SheetGeometry;
}

export type SheetLayoutResolution =
  | { status: "resolved"; layout: ResolvedSheetLayout }
  | {
      status: "unresolved";
      issues: readonly SheetLayoutIssue[];
      /** Why no value was derived, so a refusal can be explained rather than repeated. */
      derivation: SheetLayoutDerivationResult;
    }
  // Every entry was readable, but the sheet they describe is not one that can
  // exist. Nothing is returned to save: a refused layout has no resolved value.
  | { status: "refused"; refusals: readonly SheetGeometryRefusal[] };

const MEASUREMENT_FIELD_IDS: ReadonlySet<string> = new Set(
  MEASUREMENT_FIELDS.map((field) => field.id),
);

/**
 * True when the only thing missing is one dimensional entry: every count is
 * usable, every other measurement parsed, and the corner-radius state has what
 * it needs. Only then is there a single unknown for the equation to solve.
 */
function onlyOneDimensionMissing(
  issues: readonly SheetLayoutIssue[],
): MeasurementFieldId | null {
  if (issues.length !== 1) {
    return null;
  }
  const [issue] = issues;
  return issue.code === "required" && MEASUREMENT_FIELD_IDS.has(issue.field)
    ? (issue.field as MeasurementFieldId)
    : null;
}

/**
 * The normalized four-state disclosure, from the entered state and whatever
 * radius it carried. `unknown` never acquires a radius, and `zero` never
 * borrows one.
 */
function cornerRadiusDisclosureOf(
  entered: CornerRadiusInput,
  parsed: ParsedMeasurement | null,
): CornerRadiusDisclosure {
  if (entered.state === "zero" || entered.state === "unknown") {
    return { state: entered.state };
  }
  if (!parsed) {
    throw new Error(`A ${entered.state} radius must carry a measurement.`);
  }
  return { state: entered.state, radiusMm: parsed.valueMm };
}

/** Restates the resolved values as the geometry the domain works in. */
function geometryOf(
  layout: Omit<ResolvedSheetLayout, "geometry">,
  entered: CornerRadiusInput,
): SheetGeometry {
  const mm = (field: MeasurementFieldId): Millimetres =>
    layout.measurements[field].valueMm;
  return {
    sheet: { widthMm: mm("sheetWidth"), heightMm: mm("sheetHeight") },
    grid: { rows: layout.counts.rows, columns: layout.counts.columns },
    label: { widthMm: mm("labelWidth"), heightMm: mm("labelHeight") },
    margins: {
      topMm: mm("marginTop"),
      rightMm: mm("marginRight"),
      bottomMm: mm("marginBottom"),
      leftMm: mm("marginLeft"),
    },
    gaps: { horizontalMm: mm("horizontalGap"), verticalMm: mm("verticalGap") },
    cornerRadius: cornerRadiusDisclosureOf(entered, layout.cornerRadius),
  };
}

/** Judges the geometry these values describe before anything may hold them. */
function judge(
  layout: Omit<ResolvedSheetLayout, "geometry">,
  entered: CornerRadiusInput,
): SheetLayoutResolution {
  const geometry = geometryOf(layout, entered);
  const validation = validateSheetGeometry(geometry);
  return validation.status === "refused"
    ? { status: "refused", refusals: validation.refusals }
    : { status: "resolved", layout: { ...layout, geometry } };
}

export function resolveSheetLayout(
  input: SheetLayoutSourceInput,
): SheetLayoutResolution {
  const validation = validateSheetLayoutInput(input);
  if (validation.status === "representable") {
    return judge(
      {
        counts: validation.counts,
        measurements: validation.measurements,
        cornerRadius: validation.cornerRadius,
        derivation: null,
      },
      input.cornerRadius,
    );
  }

  const missing = onlyOneDimensionMissing(validation.issues);
  if (!missing) {
    return {
      status: "unresolved",
      issues: validation.issues,
      derivation: { status: "not-attempted", reason: "multiple-missing" },
    };
  }

  const derivation = deriveMissingDimension(input);
  if (derivation.status !== "derived") {
    // A refusal replaces the bare "Enter a value." with the reason the value
    // could not be supplied, against the same field.
    const issues =
      derivation.status === "refused"
        ? [
            {
              field: derivation.field,
              code: derivation.code,
              message: derivation.message,
            },
          ]
        : validation.issues;
    return { status: "unresolved", issues, derivation };
  }

  // The single missing field is the only gap in `partial`, and it is filled in
  // here, so the record is complete even though its parts are typed as optional.
  const measurements = {
    ...validation.partial.measurements,
    [missing]: {
      status: "derived",
      valueMm: derivation.derivation.valueMm,
      derivation: derivation.derivation,
    },
  } as Record<MeasurementFieldId, ResolvedMeasurement>;
  return judge(
    {
      counts: validation.partial.counts as Record<CountFieldId, number>,
      measurements,
      cornerRadius: validation.partial.cornerRadius,
      derivation: derivation.derivation,
    },
    input.cornerRadius,
  );
}
