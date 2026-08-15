import {
  COUNT_FIELDS,
  MEASUREMENT_FIELDS,
  cornerRadiusValue,
  type CountFieldId,
  type MeasurementFieldId,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import { MAX_GRID_COUNT, MIN_GRID_COUNT, isGridCount } from "./SheetGeometry";
import {
  REQUIRED_MESSAGE,
  parseMeasurement,
  type MeasurementParseErrorCode,
  type ParsedMeasurement,
} from "./parseMeasurement";

/**
 * Turns source input into normalized millimetres, or into structured refusals.
 *
 * Two things are checked: representability — is every required field present,
 * are the counts bounded positive integers, does the corner-radius state carry
 * the payload its variant requires — and measurement parsing, which is
 * delegated to parseMeasurement.ts.
 *
 * This deliberately does not judge the resulting geometry: negative lengths,
 * overlapping labels, and contradictory extents are refused elsewhere. Nothing
 * here mutates the input, so invalid source text always survives for
 * correction.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

export type SheetLayoutIssueCode =
  | "required"
  | "count-not-an-integer"
  | "count-out-of-range"
  | MeasurementParseErrorCode;

export interface SheetLayoutIssue {
  field: SheetLayoutFieldId;
  code: SheetLayoutIssueCode;
  message: string;
}

/**
 * Normalized millimetres for one layout, each still carrying the text and unit
 * it came from. The display unit is a separate, presentational choice: it is
 * not read back out of these values.
 */
export interface NormalizedSheetLayout {
  counts: Readonly<Record<CountFieldId, number>>;
  measurements: Readonly<Record<MeasurementFieldId, ParsedMeasurement>>;
  /** Null for the zero and unknown states, which carry no measurement. */
  cornerRadius: ParsedMeasurement | null;
}

export type SheetLayoutInputValidation =
  | ({ status: "representable" } & NormalizedSheetLayout)
  | { status: "unrepresentable"; issues: readonly SheetLayoutIssue[] };

/**
 * Parses a count without accepting anything a Number() coercion would let
 * through: empty text, whitespace, "1e3", "12px", or a decimal fraction.
 */
function parseCount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

function validateCount(
  field: CountFieldId,
  label: string,
  text: string,
  issues: SheetLayoutIssue[],
): number | null {
  if (!text.trim()) {
    issues.push({ field, code: "required", message: REQUIRED_MESSAGE });
    return null;
  }
  const value = parseCount(text);
  if (value === null) {
    issues.push({
      field,
      code: "count-not-an-integer",
      message: `${label} must be a whole number.`,
    });
    return null;
  }
  if (!isGridCount(value)) {
    issues.push({
      field,
      code: "count-out-of-range",
      message: `${label} must be between ${MIN_GRID_COUNT} and ${MAX_GRID_COUNT}.`,
    });
    return null;
  }
  return value;
}

/**
 * Parses one measurement, recording any refusal against its own field. The
 * empty case keeps the plain `required` code so a missing entry reads the same
 * whether it is a measurement or a count.
 */
function normalizeMeasurement(
  field: SheetLayoutFieldId,
  input: SheetLayoutSourceInput["measurements"][MeasurementFieldId],
  issues: SheetLayoutIssue[],
): ParsedMeasurement | null {
  const result = parseMeasurement(field, input);
  if (result.status === "parsed") {
    return result;
  }
  issues.push({
    field,
    code: result.code === "measurement-required" ? "required" : result.code,
    message: result.message,
  });
  return null;
}

export function validateSheetLayoutInput(
  input: SheetLayoutSourceInput,
): SheetLayoutInputValidation {
  const issues: SheetLayoutIssue[] = [];

  const measurements = {} as Record<MeasurementFieldId, ParsedMeasurement>;
  for (const field of MEASUREMENT_FIELDS) {
    const parsed = normalizeMeasurement(
      field.id,
      input.measurements[field.id],
      issues,
    );
    if (parsed) {
      measurements[field.id] = parsed;
    }
  }

  const counts = {} as Record<CountFieldId, number>;
  for (const field of COUNT_FIELDS) {
    const value = validateCount(
      field.id,
      field.label,
      input.counts[field.id].text,
      issues,
    );
    if (value !== null) {
      counts[field.id] = value;
    }
  }

  // Only the known and estimated states carry a radius; zero and unknown are
  // complete on their own, and unknown must never be filled in as zero.
  const radius = cornerRadiusValue(input.cornerRadius);
  const cornerRadius =
    radius === null
      ? null
      : normalizeMeasurement("cornerRadius", radius, issues);

  if (issues.length > 0) {
    return { status: "unrepresentable", issues };
  }
  return { status: "representable", counts, measurements, cornerRadius };
}

/** Indexes issues by field so a form can attach each one to its own control. */
export function issuesByField(
  issues: readonly SheetLayoutIssue[],
): ReadonlyMap<SheetLayoutFieldId, SheetLayoutIssue> {
  const byField = new Map<SheetLayoutFieldId, SheetLayoutIssue>();
  for (const issue of issues) {
    if (!byField.has(issue.field)) {
      byField.set(issue.field, issue);
    }
  }
  return byField;
}
