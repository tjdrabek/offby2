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
 * Renders normalized millimetres in a display unit, dropping trailing zeros.
 *
 * The result is for display only. Nothing reads it back, so the rounding here
 * has no path into stored geometry.
 */
export function formatMillimetres(
  value: Millimetres,
  unit: LengthUnit,
  maxFractionDigits = 4,
): string {
  const scaled = fromMillimetres(value, unit);
  const fixed = scaled.toFixed(maxFractionDigits);
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
