/**
 * Resolves source input into the millimetre values a layout is made of,
 * deriving at most one of them.
 *
 * Validation (validateSheetLayoutInput.ts) answers "is every entry present and
 * readable"; derivation (deriveDimension.ts) answers "can the one absent
 * dimension be computed". This module is the only place the two are combined,
 * and it keeps the join deliberately narrow: derivation is attempted only when
 * a single empty dimensional field is the sole thing standing in the way, so a
 * derived value is never presented while some other entry is still wrong.
 *
 * A derived measurement carries `status: "derived"` and its disclosure rather
 * than a source text, so it stays distinguishable from an entered value
 * wherever it is shown or saved.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  MEASUREMENT_FIELDS,
  type CountFieldId,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import type { Millimetres } from "./SheetGeometry";
import type { ParsedMeasurement } from "./parseMeasurement";
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
}

export type SheetLayoutResolution =
  | { status: "resolved"; layout: ResolvedSheetLayout }
  | {
      status: "unresolved";
      issues: readonly SheetLayoutIssue[];
      /** Why no value was derived, so a refusal can be explained rather than repeated. */
      derivation: SheetLayoutDerivationResult;
    };

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

export function resolveSheetLayout(
  input: SheetLayoutSourceInput,
): SheetLayoutResolution {
  const validation = validateSheetLayoutInput(input);
  if (validation.status === "representable") {
    return {
      status: "resolved",
      layout: {
        counts: validation.counts,
        measurements: validation.measurements,
        cornerRadius: validation.cornerRadius,
        derivation: null,
      },
    };
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
  return {
    status: "resolved",
    layout: {
      counts: validation.partial.counts as Record<CountFieldId, number>,
      measurements,
      cornerRadius: validation.partial.cornerRadius,
      derivation: derivation.derivation,
    },
  };
}
