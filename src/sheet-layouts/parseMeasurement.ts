/**
 * Parses one entered measurement into finite millimetres.
 *
 * Accepted notations are decimal ("63.5"), whole-plus-fraction ("8 1/2") and
 * fraction-only ("3/4"). Fractions are read token by token with a bounded
 * regular expression and evaluated with ordinary arithmetic — there is no
 * `eval`, `Function`, or other dynamic code path, so entered text can never be
 * executed.
 *
 * Every outcome is data: a finite {@link Millimetres} value plus a disclosure
 * of exactly what was typed, or a structured error naming the field, a code,
 * and how to correct it. Nothing here mutates or rewrites the source input.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import { millimetres, type Millimetres } from "./SheetGeometry.js";
import {
  type LengthUnit,
  type MeasurementInput,
  type SheetLayoutFieldId,
} from "./SheetLayoutInput.js";
import { toMillimetres } from "./measurementUnits.js";
import {
  ENTER_VALUE_REMEDY,
  composeRefusalMessage,
  type RefusalRemedy,
} from "./refusalMessage.js";

/**
 * Largest supported magnitude. A sheet is never a kilometre across, and the
 * bound keeps a pasted digit string from reaching infinity through `Number`.
 */
export const MAX_MEASUREMENT_MM = 1_000_000;

/** Each fraction token is capped so no part of a fraction can be excessive. */
export const MAX_FRACTION_TOKEN_DIGITS = 6;

export const REQUIRED_MESSAGE = ENTER_VALUE_REMEDY.text;

export type MeasurementParseErrorCode =
  | "measurement-required"
  | "measurement-malformed"
  | "measurement-zero-denominator"
  | "measurement-fraction-too-large"
  | "measurement-fraction-requires-inches"
  | "measurement-out-of-range";

/** How the value was written, retained so a disclosure can say so. */
export type MeasurementNotation = "decimal" | "fraction";

/** Exactly what the user typed, kept alongside the normalized value. */
export interface MeasurementSourceDisclosure {
  /** The entered text, trimmed of surrounding whitespace but not rewritten. */
  text: string;
  /** The unit the text was entered in. */
  unit: LengthUnit;
  notation: MeasurementNotation;
}

export interface ParsedMeasurement {
  status: "parsed";
  /** Authoritative normalized value. Finiteness is guaranteed by the brand. */
  valueMm: Millimetres;
  source: MeasurementSourceDisclosure;
}

export interface MeasurementParseFailure {
  status: "invalid";
  field: SheetLayoutFieldId;
  code: MeasurementParseErrorCode;
  explanation: string;
  remedies: readonly RefusalRemedy[];
  message: string;
}

export type MeasurementParseResult =
  ParsedMeasurement | MeasurementParseFailure;

/** Decimal only: "1e3", "1,5", "12mm", "NaN" and "Infinity" all fail to match. */
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

/** Optional sign, optional whole part, then numerator "/" denominator. */
const FRACTION_PATTERN = /^([+-]?)(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/;

function failure(
  field: SheetLayoutFieldId,
  code: MeasurementParseErrorCode,
  explanation: string,
  remedies: readonly RefusalRemedy[],
): MeasurementParseFailure {
  return {
    status: "invalid",
    field,
    code,
    explanation,
    remedies,
    message: composeRefusalMessage({ explanation, remedies }),
  };
}

function malformedMessage(unit: LengthUnit): string {
  return unit === "in"
    ? "Enter a measurement such as 63.5, 8 1/2, or 3/4."
    : "Enter a decimal measurement such as 63.5 or 0.5.";
}

/** Brands the scaled value, refusing anything non-finite or beyond the bound. */
function normalize(
  field: SheetLayoutFieldId,
  value: number,
  unit: LengthUnit,
  text: string,
  notation: MeasurementNotation,
): MeasurementParseResult {
  const scaled = toMillimetres(value, unit);
  if (!Number.isFinite(scaled) || Math.abs(scaled) > MAX_MEASUREMENT_MM) {
    return failure(
      field,
      "measurement-out-of-range",
      `Enter a smaller measurement. The largest supported value is ${MAX_MEASUREMENT_MM} mm.`,
      [],
    );
  }
  return {
    status: "parsed",
    valueMm: millimetres(scaled),
    source: { text, unit, notation },
  };
}

function parseFraction(
  field: SheetLayoutFieldId,
  text: string,
  unit: LengthUnit,
): MeasurementParseResult {
  const match = FRACTION_PATTERN.exec(text);
  if (!match) {
    return failure(field, "measurement-malformed", "", [
      { action: "enter-value", text: malformedMessage(unit) },
    ]);
  }
  // Fraction notation is an imperial convention; "1 1/2 mm" is far more likely
  // a mistake than an intent, so it is refused rather than guessed at.
  if (unit !== "in") {
    return failure(
      field,
      "measurement-fraction-requires-inches",
      "Fractions are only accepted for inches.",
      [
        { action: "enter-value", text: "Enter a decimal value." },
        {
          action: "change-unit",
          text: "Change the measurement unit to inches.",
        },
      ],
    );
  }
  const [, sign, whole = "0", numerator, denominator] = match;
  if (
    whole.length > MAX_FRACTION_TOKEN_DIGITS ||
    numerator.length > MAX_FRACTION_TOKEN_DIGITS ||
    denominator.length > MAX_FRACTION_TOKEN_DIGITS
  ) {
    return failure(field, "measurement-fraction-too-large", "", [
      {
        action: "enter-value",
        text: `Keep each part of a fraction to ${MAX_FRACTION_TOKEN_DIGITS} digits or fewer.`,
      },
    ]);
  }
  const divisor = Number(denominator);
  if (divisor === 0) {
    return failure(
      field,
      "measurement-zero-denominator",
      "A fraction cannot be divided by zero.",
      [
        {
          action: "enter-value",
          text: "Use a denominator such as 2, 4, 8, or 16.",
        },
      ],
    );
  }
  const magnitude = Number(whole) + Number(numerator) / divisor;
  return normalize(
    field,
    sign === "-" ? -magnitude : magnitude,
    unit,
    text,
    "fraction",
  );
}

/**
 * Parses one entered measurement. The result is either a finite millimetre
 * value with its source disclosure, or a structured refusal.
 */
export function parseMeasurement(
  field: SheetLayoutFieldId,
  input: MeasurementInput,
): MeasurementParseResult {
  const text = input.text.trim();
  if (!text) {
    return failure(field, "measurement-required", "", [ENTER_VALUE_REMEDY]);
  }
  if (text.includes("/")) {
    return parseFraction(field, text, input.unit);
  }
  if (!DECIMAL_PATTERN.test(text)) {
    return failure(field, "measurement-malformed", "", [
      { action: "enter-value", text: malformedMessage(input.unit) },
    ]);
  }
  return normalize(field, Number(text), input.unit, text, "decimal");
}
