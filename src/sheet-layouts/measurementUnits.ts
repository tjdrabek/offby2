/**
 * Conversion between the unit a measurement was entered in and the
 * millimetres that are authoritative for every domain calculation.
 *
 * Conversion is exact by definition: one inch is exactly 25.4 mm and one
 * centimetre is exactly 10 mm. Binary floating point still leaves dust on some
 * products (for example `8.5 * 25.4` is 215.89999999999998, not 215.9), so
 * equality between two independently normalized values is compared with
 * {@link MEASUREMENT_TOLERANCE_MM} rather than `===`.
 *
 * Formatting lives here too, but only as presentation: a formatted string is
 * never parsed back into geometry, so display rounding cannot reach a durable
 * value.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import { millimetres, type Millimetres } from "./SheetGeometry";
import { lengthUnitSuffix, type LengthUnit } from "./SheetLayoutInput";

/** Exact by definition of the international inch. */
export const MM_PER_INCH = 25.4;
export const MM_PER_CENTIMETRE = 10;

/**
 * Documented numeric precision. Values that differ by less than this are the
 * same measurement expressed two ways; the bound is far below any physical
 * printing tolerance and far above double-precision dust at sheet scale.
 */
export const MEASUREMENT_TOLERANCE_MM = 1e-9;

export function millimetresPerUnit(unit: LengthUnit): number {
  switch (unit) {
    case "mm":
      return 1;
    case "cm":
      return MM_PER_CENTIMETRE;
    case "in":
      return MM_PER_INCH;
  }
}

/** Scales a value expressed in `unit` to plain millimetres. */
export function toMillimetres(value: number, unit: LengthUnit): number {
  return value * millimetresPerUnit(unit);
}

/** Scales normalized millimetres back into a display unit. */
export function fromMillimetres(value: Millimetres, unit: LengthUnit): number {
  return value / millimetresPerUnit(unit);
}

/** True when two millimetre values agree within the documented precision. */
export function measurementsEqual(
  left: number,
  right: number,
  tolerance: number = MEASUREMENT_TOLERANCE_MM,
): boolean {
  return Math.abs(left - right) <= tolerance;
}

/**
 * Display precision per unit, chosen from what each unit's products are
 * actually specified in: a tenth of a millimetre covers every published label
 * dimension, two centimetre decimals are that same tenth, and inch products
 * are specified in eighths (0.125) so three decimals render them exactly.
 * More digits than these are conversion dust, not information.
 */
const DISPLAY_FRACTION_DIGITS: Record<LengthUnit, number> = {
  mm: 1,
  cm: 2,
  in: 3,
};

/**
 * Renders normalized millimetres in a display unit, dropping trailing zeros.
 *
 * The result is for display only. Nothing reads it back, so the rounding here
 * has no path into stored geometry.
 */
export function formatMillimetres(
  value: Millimetres,
  unit: LengthUnit,
  maxFractionDigits?: number,
): string {
  const scaled = fromMillimetres(value, unit);
  const fixed = scaled.toFixed(maxFractionDigits ?? DISPLAY_FRACTION_DIGITS[unit]);
  const trimmed = fixed.includes(".")
    ? fixed.replace(/0+$/, "").replace(/\.$/, "")
    : fixed;
  // toFixed can render a tiny negative as "-0"; that is noise, not a value.
  return trimmed === "-0" ? "0" : trimmed;
}

/** "63.5 mm" — the normalized value with the unit it is being shown in. */
export function formatMeasurement(
  value: Millimetres,
  unit: LengthUnit,
  maxFractionDigits?: number,
): string {
  return `${formatMillimetres(value, unit, maxFractionDigits)} ${lengthUnitSuffix(unit)}`;
}

/** Convenience for tests and callers that already hold a finite unit value. */
export function measurementFrom(value: number, unit: LengthUnit): Millimetres {
  return millimetres(toMillimetres(value, unit));
}

/**
 * Entry precision per unit: what a converted value is rounded to when it is
 * written back into a field. A tenth of a millimetre, and two decimals in
 * centimetres or inches — the precision a person with a rule works at. An
 * entry reading 0.4724409449 is not a measurement anyone made, and the small
 * loss it avoids is far below any physical printing tolerance.
 */
const ENTRY_FRACTION_DIGITS: Record<LengthUnit, number> = {
  mm: 1,
  cm: 2,
  in: 2,
};

/** The value as a person would type it in `unit`, rounded to entry precision. */
export function roundedMeasurementText(
  value: Millimetres,
  unit: LengthUnit,
): string {
  return formatMillimetres(value, unit, ENTRY_FRACTION_DIGITS[unit]);
}

/**
 * The largest error entry rounding can introduce: half the coarsest entry
 * step, which is two inch decimals — 0.005 in, a little under 0.13 mm.
 * Comparisons that must recognise a rounded entry as the value it came from
 * use this; geometry comparisons keep {@link MEASUREMENT_TOLERANCE_MM}.
 */
export const ENTRY_TOLERANCE_MM = 0.13;

/**
 * As many fraction digits as a converted value could ever need. Only reached
 * by a value with no exact decimal in the target unit, and far more precision
 * than any physical label dimension carries.
 */
const MAX_LOSSLESS_DIGITS = 12;

/**
 * The shortest text in `unit` that still means the same measurement.
 *
 * Display rounding cannot be reused for conversion: `formatMillimetres`
 * defaults to four fraction digits, which is right for showing a value and
 * wrong for rewriting an entry — 4.7625 mm would become "0.4762" cm and the
 * axis it belongs to would stop adding up to the sheet. Each candidate is
 * therefore normalized back and kept only if it equals the value it came
 * from within the documented tolerance. Shorter is preferred purely so an
 * operator sees "0.5" rather than "0.500000000000".
 */
export function losslessMeasurementText(
  value: Millimetres,
  unit: LengthUnit,
): string {
  for (let digits = 0; digits <= MAX_LOSSLESS_DIGITS; digits += 1) {
    const text = formatMillimetres(value, unit, digits);
    if (measurementsEqual(toMillimetres(Number(text), unit), value)) {
      return text;
    }
  }
  // No exact decimal exists in this unit. The longest candidate is the
  // closest one, and its error is far below the documented tolerance scale.
  return formatMillimetres(value, unit, MAX_LOSSLESS_DIGITS);
}
