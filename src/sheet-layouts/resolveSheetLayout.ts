/**
 * Resolves source input into the millimetre values a layout is made of,
 * deriving at most one of them and refusing geometry that cannot be described.
 *
 * Validation (validateSheetLayoutInput.ts) answers "is every entry present and
 * readable"; derivation (deriveDimension.ts) answers "can the one absent
 * dimension be computed"; geometry validation (validateSheetGeometry.ts)
 * answers "is the resulting sheet possible". This module is the only place the
 * three are combined, and it keeps the joins deliberately narrow: derivation is
 * attempted only when empty dimensional fields are the sole thing standing in
 * the way and no axis carries more than one of them, and geometry is judged
 * only once every value is in millimetres, so a derived value is never
 * presented while some other entry is still wrong.
 *
 * Because the two axis equations share no term, one blank per axis is one
 * unknown per equation: a layout that leaves both label width and label height
 * out is resolvable from its margins, gaps, and counts.
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
  type LengthUnit,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput.js";
import type {
  CornerRadiusDisclosure,
  Millimetres,
  SheetGeometry,
} from "./SheetGeometry.js";
import type { ParsedMeasurement } from "./parseMeasurement.js";
import {
  validateSheetGeometry,
  type SheetGeometryRefusal,
} from "./validateSheetGeometry.js";
import {
  axisEquationFor,
  deriveMissingDimensions,
  type AxisDerivationResults,
  type DerivationAxis,
  type SheetLayoutDerivation,
} from "./deriveDimension.js";
import {
  validateSheetLayoutInput,
  type SheetLayoutIssue,
} from "./validateSheetLayoutInput.js";

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
  /**
   * The fields that were worked out rather than entered — at most one per
   * axis, and empty when every value was entered.
   */
  derivations: readonly SheetLayoutDerivation[];
  /** The same values as normalized geometry, judged and accepted. */
  geometry: SheetGeometry;
}

export type SheetLayoutResolution =
  | { status: "resolved"; layout: ResolvedSheetLayout }
  | {
      status: "unresolved";
      issues: readonly SheetLayoutIssue[];
      /**
       * Why each axis supplied no value, so a refusal can be explained rather
       * than repeated. An axis that had nothing to derive says so.
       */
      derivation: AxisDerivationResults;
    }
  // Every entry was readable, but the sheet they describe is not one that can
  // exist. Nothing is returned to save: a refused layout has no resolved value.
  | { status: "refused"; refusals: readonly SheetGeometryRefusal[] };

const MEASUREMENT_FIELD_IDS: ReadonlySet<string> = new Set(
  MEASUREMENT_FIELDS.map((field) => field.id),
);

/**
 * The blank dimensions, when blank dimensions are the only thing wrong and no
 * axis carries more than one of them.
 *
 * Each axis is its own equation with its own terms, so one unknown per axis is
 * one unknown per equation and every one of them is solvable. Two on the same
 * axis is not, and anything other than a missing dimension — an unusable count,
 * an unreadable entry, a corner-radius state without its radius — has to be
 * corrected before an equation is worth attempting at all.
 */
function missingOnePerAxis(
  issues: readonly SheetLayoutIssue[],
): MeasurementFieldId[] | null {
  const missing: MeasurementFieldId[] = [];
  const axes = new Set<DerivationAxis>();
  for (const issue of issues) {
    if (issue.code !== "required" || !MEASUREMENT_FIELD_IDS.has(issue.field)) {
      return null;
    }
    const field = issue.field as MeasurementFieldId;
    const { axis } = axisEquationFor(field);
    if (axes.has(axis)) {
      return null;
    }
    axes.add(axis);
    missing.push(field);
  }
  return missing.length > 0 ? missing : null;
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

/**
 * The unit a layout's refusals speak in: the one its sheet width was entered
 * in. Every entry normally shares it; when they do not, the paper's is as good
 * a choice as any.
 */
export function entryUnitOf(input: SheetLayoutSourceInput): LengthUnit {
  return input.measurements.sheetWidth.unit;
}

/** Judges the geometry these values describe before anything may hold them. */
function judge(
  layout: Omit<ResolvedSheetLayout, "geometry">,
  entered: CornerRadiusInput,
  unit: LengthUnit,
): SheetLayoutResolution {
  const geometry = geometryOf(layout, entered);
  const validation = validateSheetGeometry(geometry, undefined, unit);
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
        derivations: [],
      },
      input.cornerRadius,
      entryUnitOf(input),
    );
  }

  const derivation = deriveMissingDimensions(input);
  const missing = missingOnePerAxis(validation.issues);
  if (!missing) {
    return { status: "unresolved", issues: validation.issues, derivation };
  }

  // Each blank field is answered by its own axis. A refusal replaces the bare
  // "Enter a value." with the reason that value could not be supplied, against
  // the same field.
  const derivations: SheetLayoutDerivation[] = [];
  const refusals: SheetLayoutIssue[] = [];
  for (const field of missing) {
    const result = derivation[axisEquationFor(field).axis];
    if (result.status === "derived") {
      derivations.push(result.derivation);
    } else if (result.status === "refused") {
      refusals.push({
        field: result.field,
        code: result.code,
        explanation: result.explanation,
        remedies: result.remedies,
        message: result.message,
      });
    }
  }

  if (derivations.length !== missing.length) {
    return {
      status: "unresolved",
      issues: refusals.length > 0 ? refusals : validation.issues,
      derivation,
    };
  }

  // The missing fields are the only gaps in `partial`, and they are filled in
  // here, so the record is complete even though its parts are typed as optional.
  const measurements = { ...validation.partial.measurements } as Record<
    MeasurementFieldId,
    ResolvedMeasurement
  >;
  for (const derived of derivations) {
    measurements[derived.field] = {
      status: "derived",
      valueMm: derived.valueMm,
      derivation: derived,
    };
  }

  return judge(
    {
      counts: validation.partial.counts as Record<CountFieldId, number>,
      measurements,
      cornerRadius: validation.partial.cornerRadius,
      derivations,
    },
    input.cornerRadius,
    entryUnitOf(input),
  );
}
