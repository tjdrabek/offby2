/**
 * Derives one missing dimension from the sheet extent equation.
 *
 * There is exactly one documented extent equation per axis, and it is the same
 * one validation and preview use:
 *
 *     extent = leading margin
 *            + count × label size
 *            + (count − 1) × gap
 *            + trailing margin
 *
 * Derivation is a disclosure, never a silent correction. It runs only when
 * exactly one eligible dimensional field is empty, the counts are usable
 * integers, and every other operand on that axis has parsed; the result then
 * names the field, the substituted equation, and the normalized millimetre
 * value so a reader can check the arithmetic. Anything else — nothing missing,
 * more than one missing, a coefficient of zero, a non-finite or negative
 * solution, or an equation that does not reconcile — is reported as its own
 * outcome rather than as a derived value.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  MEASUREMENT_FIELDS,
  countFieldLabel,
  measurementFieldLabel,
  type CountFieldId,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import {
  isGridCount,
  millimetres,
  parseGridCountText,
  type Millimetres,
} from "./SheetGeometry";
import { MAX_MEASUREMENT_MM, parseMeasurement } from "./parseMeasurement";
import {
  MEASUREMENT_TOLERANCE_MM,
  formatMillimetres,
} from "./measurementUnits";
import {
  ENTER_VALUE_REMEDY,
  composeRefusalMessage,
  type RefusalRemedy,
} from "./refusalMessage";

export type DerivationAxis = "horizontal" | "vertical";

/** One axis of the uniform grid, named by the fields its equation relates. */
export interface AxisEquation {
  axis: DerivationAxis;
  extent: MeasurementFieldId;
  leading: MeasurementFieldId;
  size: MeasurementFieldId;
  gap: MeasurementFieldId;
  trailing: MeasurementFieldId;
  count: CountFieldId;
}

/** Used where a message speaks about a single row or column. */
export const COUNT_SINGULAR: Record<CountFieldId, string> = {
  rows: "row",
  columns: "column",
};

export const AXIS_EQUATIONS: readonly AxisEquation[] = [
  {
    axis: "horizontal",
    extent: "sheetWidth",
    leading: "marginLeft",
    size: "labelWidth",
    gap: "horizontalGap",
    trailing: "marginRight",
    count: "columns",
  },
  {
    axis: "vertical",
    extent: "sheetHeight",
    leading: "marginTop",
    size: "labelHeight",
    gap: "verticalGap",
    trailing: "marginBottom",
    count: "rows",
  },
];

/** The axis whose equation contains this field. Every dimension is on one axis. */
export function axisEquationFor(field: MeasurementFieldId): AxisEquation {
  const equation = AXIS_EQUATIONS.find((candidate) =>
    [
      candidate.extent,
      candidate.leading,
      candidate.size,
      candidate.gap,
      candidate.trailing,
    ].includes(field),
  );
  if (!equation) {
    throw new Error(`No axis equation contains ${field}.`);
  }
  return equation;
}

export type DerivationRefusalCode =
  | "derivation-not-finite"
  | "derivation-negative"
  | "derivation-out-of-range"
  | "derivation-unreconciled";

/** Why derivation was not attempted. None of these is a refusal of the entry. */
export type DerivationSkipReason =
  | "nothing-missing"
  | "multiple-missing"
  | "counts-unusable"
  | "operands-unusable";

/** One known quantity the equation was solved with. */
export interface DerivationOperand {
  field: MeasurementFieldId | CountFieldId;
  label: string;
  /** Millimetres for a measurement; a plain integer for a count. */
  value: number;
}

export interface SheetLayoutDerivation {
  field: MeasurementFieldId;
  label: string;
  axis: DerivationAxis;
  /** The axis equation written with field names. */
  equation: string;
  /** The same equation with every operand, including the derived value, substituted. */
  substitution: string;
  operands: readonly DerivationOperand[];
  /** The normalized, authoritative result. */
  valueMm: Millimetres;
}

export type SheetLayoutDerivationResult =
  | { status: "derived"; derivation: SheetLayoutDerivation }
  | { status: "not-attempted"; reason: DerivationSkipReason }
  | {
      status: "refused";
      field: MeasurementFieldId;
      axis: DerivationAxis;
      code: DerivationRefusalCode;
      /** What happened and why. */
      explanation: string;
      /** Empty when the explanation stands with nothing left to correct. */
      remedies: readonly RefusalRemedy[];
      /** {@link composeRefusalMessage} applied to explanation and remedies. */
      message: string;
    };

interface AxisValues {
  extent: number;
  leading: number;
  size: number;
  gap: number;
  trailing: number;
}

type AxisTermId = keyof AxisValues;

/** Multiplier each term carries in `extent = leading + n × size + (n − 1) × gap + trailing`. */
function coefficientOf(term: AxisTermId, count: number): number {
  switch (term) {
    case "extent":
    case "leading":
    case "trailing":
      return 1;
    case "size":
      return count;
    case "gap":
      return count - 1;
  }
}

/** The right-hand side, evaluated from complete axis values. */
function rightHandSide(values: AxisValues, count: number): number {
  return (
    values.leading +
    count * values.size +
    (count - 1) * values.gap +
    values.trailing
  );
}

function mm(value: number): string {
  // Full precision, not display precision: derivation messages state
  // arithmetic the reader is invited to check, and rounded terms stop
  // adding up.
  return formatMillimetres(millimetres(value), "mm", 4);
}

/** "Sheet width = Left margin + Columns × Label width + …" */
export function axisEquationText(equation: AxisEquation): string {
  const count = countFieldLabel(equation.count);
  return (
    `${measurementFieldLabel(equation.extent)} = ` +
    `${measurementFieldLabel(equation.leading)} + ` +
    `${count} × ${measurementFieldLabel(equation.size)} + ` +
    `(${count} − 1) × ${measurementFieldLabel(equation.gap)} + ` +
    `${measurementFieldLabel(equation.trailing)}`
  );
}

/** "210 = 7.5 + 3 × 63.5 + 2 × 2.5 + 7", in millimetres throughout. */
function substitutionText(values: AxisValues, count: number): string {
  return (
    `${mm(values.extent)} = ${mm(values.leading)} + ` +
    `${count} × ${mm(values.size)} + ${count - 1} × ${mm(values.gap)} + ` +
    `${mm(values.trailing)}`
  );
}

function operandsOf(
  equation: AxisEquation,
  values: AxisValues,
  count: number,
  derived: AxisTermId,
): DerivationOperand[] {
  const terms: AxisTermId[] = ["extent", "leading", "size", "gap", "trailing"];
  const operands: DerivationOperand[] = terms
    .filter((term) => term !== derived)
    .map((term) => ({
      field: equation[term],
      label: measurementFieldLabel(equation[term]),
      value: values[term],
    }));
  operands.push({
    field: equation.count,
    label: countFieldLabel(equation.count),
    value: count,
  });
  return operands;
}

function refusal(
  field: MeasurementFieldId,
  axis: DerivationAxis,
  code: DerivationRefusalCode,
  explanation: string,
  remedies: readonly RefusalRemedy[],
): SheetLayoutDerivationResult {
  return {
    status: "refused",
    field,
    axis,
    code,
    explanation,
    remedies,
    message: composeRefusalMessage({ explanation, remedies }),
  };
}

/** The remedy pair a derivation refusal offers: try the other axis values, or supply this one directly. */
function checkAxisOrEnterValueRemedies(
  axis: DerivationAxis,
): readonly RefusalRemedy[] {
  return [
    { action: "check-other-axis-values", text: `Check the other ${axis} values.` },
    { action: "enter-value", text: "Enter this one." },
  ];
}

/**
 * Solves the axis equation for `term`, refusing every outcome that is not one
 * finite, non-negative, self-consistent value.
 */
function solve(
  equation: AxisEquation,
  known: Partial<Record<AxisTermId, number>>,
  count: number,
  term: AxisTermId,
): SheetLayoutDerivationResult {
  const field = equation[term];
  const label = measurementFieldLabel(field);
  const coefficient = coefficientOf(term, count);
  const withoutTerm: AxisValues = {
    extent: known.extent ?? 0,
    leading: known.leading ?? 0,
    size: known.size ?? 0,
    gap: known.gap ?? 0,
    trailing: known.trailing ?? 0,
    [term]: 0,
  };
  // A zero coefficient is the gap on a single-row or single-column axis: the
  // term vanishes from the equation because the sheet has no such gap. Zero
  // is the only value that describes that, so it is derived as exactly zero
  // — the residual check below still holds the rest of the axis to account.
  const solved =
    coefficient === 0
      ? 0
      : term === "extent"
        ? rightHandSide(withoutTerm, count)
        : (withoutTerm.extent - rightHandSide(withoutTerm, count)) /
          coefficient;

  if (!Number.isFinite(solved)) {
    return refusal(
      field,
      equation.axis,
      "derivation-not-finite",
      `${label} could not be derived as a finite value from the other measurements on this axis.`,
      [ENTER_VALUE_REMEDY],
    );
  }
  // Values within the documented tolerance of zero are the same measurement as
  // zero, so the sign of floating-point dust is not reported as a negative.
  const value = Math.abs(solved) <= MEASUREMENT_TOLERANCE_MM ? 0 : solved;
  if (value < 0) {
    return refusal(
      field,
      equation.axis,
      "derivation-negative",
      `Deriving ${label} from the other measurements gives ${mm(value)} mm, and a measurement cannot be negative.`,
      checkAxisOrEnterValueRemedies(equation.axis),
    );
  }
  if (value > MAX_MEASUREMENT_MM) {
    return refusal(
      field,
      equation.axis,
      "derivation-out-of-range",
      `Deriving ${label} gives a value beyond the largest supported measurement of ${MAX_MEASUREMENT_MM} mm.`,
      checkAxisOrEnterValueRemedies(equation.axis),
    );
  }

  const values: AxisValues = { ...withoutTerm, [term]: value };
  // Substituting back is what makes the disclosure checkable: the equation the
  // reader is shown is the one that was actually satisfied.
  const residual = Math.abs(values.extent - rightHandSide(values, count));
  const tolerance =
    MEASUREMENT_TOLERANCE_MM * Math.max(1, Math.abs(values.extent));
  if (residual > tolerance) {
    return refusal(
      field,
      equation.axis,
      "derivation-unreconciled",
      `${label} could not be derived: the ${equation.axis} measurements do not reconcile within the supported precision.`,
      [ENTER_VALUE_REMEDY],
    );
  }

  return {
    status: "derived",
    derivation: {
      field,
      label,
      axis: equation.axis,
      equation: axisEquationText(equation),
      substitution: substitutionText(values, count),
      operands: operandsOf(equation, values, count, term),
      valueMm: millimetres(value),
    },
  };
}

/** The usable row and column counts, or null when either is unusable. */
function readCounts(
  input: SheetLayoutSourceInput,
): Record<CountFieldId, number> | null {
  const rows = parseGridCountText(input.counts.rows.text);
  const columns = parseGridCountText(input.counts.columns.text);
  if (rows === null || columns === null) {
    return null;
  }
  return isGridCount(rows) && isGridCount(columns) ? { rows, columns } : null;
}

/** Every entry read once, so both axes are solved from the same reading. */
interface MeasurementEntries {
  parsed: ReadonlyMap<MeasurementFieldId, number>;
  /** Fields left blank. A field that was entered but unreadable is in neither. */
  missing: readonly MeasurementFieldId[];
}

function readMeasurements(input: SheetLayoutSourceInput): MeasurementEntries {
  const parsed = new Map<MeasurementFieldId, number>();
  const missing: MeasurementFieldId[] = [];
  for (const field of MEASUREMENT_FIELDS) {
    const result = parseMeasurement(field.id, input.measurements[field.id]);
    if (result.status === "parsed") {
      parsed.set(field.id, result.valueMm);
    } else if (result.code === "measurement-required") {
      missing.push(field.id);
    }
  }
  return { parsed, missing };
}

/**
 * Solves one axis for whichever of its dimensions was left blank.
 *
 * "Nothing missing" and "more than one missing" are both reported against this
 * axis alone. The other axis is a separate equation with separate terms, and
 * says nothing about whether this one can be solved.
 */
function deriveOnAxis(
  equation: AxisEquation,
  entries: MeasurementEntries,
  count: number,
): SheetLayoutDerivationResult {
  const missing = entries.missing.filter(
    (field) => axisEquationFor(field).axis === equation.axis,
  );
  if (missing.length === 0) {
    return { status: "not-attempted", reason: "nothing-missing" };
  }
  if (missing.length > 1) {
    return { status: "not-attempted", reason: "multiple-missing" };
  }

  const field = missing[0];
  const terms: AxisTermId[] = ["extent", "leading", "size", "gap", "trailing"];
  const known: Partial<Record<AxisTermId, number>> = {};
  let derivedTerm: AxisTermId | null = null;
  for (const term of terms) {
    if (equation[term] === field) {
      derivedTerm = term;
      continue;
    }
    const value = entries.parsed.get(equation[term]);
    if (value === undefined) {
      return { status: "not-attempted", reason: "operands-unusable" };
    }
    known[term] = value;
  }
  if (!derivedTerm) {
    return { status: "not-attempted", reason: "operands-unusable" };
  }

  return solve(equation, known, count, derivedTerm);
}

/** One result per axis, in the order of {@link AXIS_EQUATIONS}. */
export interface AxisDerivationResults {
  horizontal: SheetLayoutDerivationResult;
  vertical: SheetLayoutDerivationResult;
}

/**
 * Derives the missing dimension of each axis independently.
 *
 * The horizontal and vertical equations share no term: a sheet's width relates
 * its left margin, columns, label width, horizontal gap and right margin, and
 * nothing else. So a layout that leaves one dimension blank on each axis has
 * two equations with one unknown apiece, not one equation with two — and both
 * are solvable. A caller wanting label width and height derived from margins
 * and gaps needs exactly this.
 *
 * An axis with nothing missing, or with more than one thing missing, reports
 * `not-attempted` for itself and does not affect the other.
 */
export function deriveMissingDimensions(
  input: SheetLayoutSourceInput,
): AxisDerivationResults {
  const counts = readCounts(input);
  if (!counts) {
    const unusable: SheetLayoutDerivationResult = {
      status: "not-attempted",
      reason: "counts-unusable",
    };
    return { horizontal: unusable, vertical: unusable };
  }

  const entries = readMeasurements(input);
  const results = {} as AxisDerivationResults;
  for (const equation of AXIS_EQUATIONS) {
    results[equation.axis] = deriveOnAxis(
      equation,
      entries,
      counts[equation.count],
    );
  }
  return results;
}

/**
 * Derives the single missing dimension of a sheet layout, if there is exactly
 * one across both axes and its equation has exactly one valid solution for it.
 *
 * Kept for callers that want the stricter one-unknown-per-sheet rule;
 * {@link deriveMissingDimensions} is the general form.
 */
export function deriveMissingDimension(
  input: SheetLayoutSourceInput,
): SheetLayoutDerivationResult {
  const counts = readCounts(input);
  if (!counts) {
    return { status: "not-attempted", reason: "counts-unusable" };
  }

  const entries = readMeasurements(input);
  if (entries.missing.length === 0) {
    return { status: "not-attempted", reason: "nothing-missing" };
  }
  if (entries.missing.length > 1) {
    return { status: "not-attempted", reason: "multiple-missing" };
  }

  const equation = axisEquationFor(entries.missing[0]);
  return deriveOnAxis(equation, entries, counts[equation.count]);
}
