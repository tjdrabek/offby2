import {
  COUNT_FIELDS,
  MEASUREMENT_FIELDS,
  cornerRadiusValue,
  type CountFieldId,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import { MAX_GRID_COUNT, MIN_GRID_COUNT, isGridCount } from "./SheetGeometry";

/**
 * Representability checks for source input: is every required field present,
 * are the counts bounded positive integers, and does the corner-radius state
 * carry the payload its variant requires.
 *
 * This deliberately does not parse measurements into millimetres or judge the
 * resulting geometry; it only decides whether the input can be normalized at
 * all. Nothing here mutates the input, so invalid source text always survives
 * for correction.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

export type SheetLayoutIssueCode =
  "required" | "count-not-an-integer" | "count-out-of-range";

export interface SheetLayoutIssue {
  field: SheetLayoutFieldId;
  code: SheetLayoutIssueCode;
  message: string;
}

export type SheetLayoutInputValidation =
  | {
      status: "representable";
      /** The only values this step can fully validate. */
      counts: Readonly<Record<CountFieldId, number>>;
    }
  | { status: "unrepresentable"; issues: readonly SheetLayoutIssue[] };

const REQUIRED_MESSAGE = "Enter a value.";

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

export function validateSheetLayoutInput(
  input: SheetLayoutSourceInput,
): SheetLayoutInputValidation {
  const issues: SheetLayoutIssue[] = [];

  for (const field of MEASUREMENT_FIELDS) {
    if (!input.measurements[field.id].text.trim()) {
      issues.push({
        field: field.id,
        code: "required",
        message: REQUIRED_MESSAGE,
      });
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
  if (radius !== null && !radius.text.trim()) {
    issues.push({
      field: "cornerRadius",
      code: "required",
      message: REQUIRED_MESSAGE,
    });
  }

  if (issues.length > 0) {
    return { status: "unrepresentable", issues };
  }
  return { status: "representable", counts };
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
