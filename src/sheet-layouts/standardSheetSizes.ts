/**
 * The sheet sizes a consumer printer is normally fed.
 *
 * These are the media themselves, not label products: a sheet of Avery 5160 is
 * a US Letter sheet with a grid die-cut into it. Keeping the two apart means a
 * consumer can offer "what paper is this?" without also having to know which
 * label product it came from, and lets an operator describe an unlisted product
 * on a listed sheet.
 *
 * Every dimension is exact by definition of its standard. ISO A sizes are
 * defined in whole millimetres; US sizes are defined in inches and converted
 * once, here, rather than at each use.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import { millimetres, type Millimetres } from "./SheetGeometry";
import {
  ENTRY_TOLERANCE_MM,
  measurementFrom,
  measurementsEqual,
} from "./measurementUnits";

export interface StandardSheetSize {
  id: string;
  /** How the size is named to an operator. */
  name: string;
  widthMm: Millimetres;
  heightMm: Millimetres;
}

/** ISO 216 A series, defined in whole millimetres. */
function isoSize(id: string, name: string, width: number, height: number) {
  return {
    id,
    name,
    widthMm: millimetres(width),
    heightMm: millimetres(height),
  };
}

/** North American sizes, defined in inches and converted once. */
function inchSize(id: string, name: string, width: number, height: number) {
  return {
    id,
    name,
    widthMm: measurementFrom(width, "in"),
    heightMm: measurementFrom(height, "in"),
  };
}

/**
 * The media a consumer print dialog offers, at the dimensions those names mean.
 *
 * Taken from what the drivers actually list rather than from what label products
 * come on: the sheet size is whatever the operator loads and tells the driver
 * about, and a size missing from here is one they cannot describe without
 * measuring their own paper. Envelopes and cards are included for the same
 * reason — being able to describe one is not a claim that labels are sold on it.
 */
export const STANDARD_SHEET_SIZES: readonly StandardSheetSize[] = [
  // North American cut sheets.
  inchSize("letter", "US Letter — 8.5 × 11 in", 8.5, 11),
  inchSize("legal", "US Legal — 8.5 × 14 in", 8.5, 14),
  inchSize("folio", "Folio — 8.5 × 13 in", 8.5, 13),
  inchSize("executive", "Executive — 7.25 × 10.5 in", 7.25, 10.5),
  inchSize("tabloid", "Tabloid — 11 × 17 in", 11, 17),
  // The same sheet as Tabloid, listed the way a driver lists it: turned round.
  inchSize("ledger", "Ledger — 17 × 11 in", 17, 11),

  // ISO A series.
  isoSize("a3", "A3 — 297 × 420 mm", 297, 420),
  isoSize("a4", "A4 — 210 × 297 mm", 210, 297),
  isoSize("a5", "A5 — 148 × 210 mm", 148, 210),
  // Drivers offer A5 both ways round, because which edge leads changes how the
  // sheet is fed. It is the same paper; it is not the same sheet layout.
  isoSize("a5-long-edge", "A5 long edge — 210 × 148 mm", 210, 148),
  isoSize("a6", "A6 — 105 × 148 mm", 105, 148),

  // B series. A dialog offering plain "B5" means the JIS one on every consumer
  // driver seen so far, so it is listed first; the ISO sheet is 6 mm narrower
  // and 7 mm shorter, which is a whole label's worth of difference.
  isoSize("b5-jis", "B5 (JIS) — 182 × 257 mm", 182, 257),
  isoSize("b5-iso", "B5 (ISO) — 176 × 250 mm", 176, 250),

  // Envelopes.
  inchSize("com-10", "Com-10 envelope — 4.125 × 9.5 in", 4.125, 9.5),
  isoSize("dl", "DL envelope — 110 × 220 mm", 110, 220),
  isoSize("c5", "C5 envelope — 162 × 229 mm", 162, 229),
  inchSize("monarch", "Monarch envelope — 3.875 × 7.5 in", 3.875, 7.5),

  // Cards.
  inchSize("index-3x5", "Index card — 3 × 5 in", 3, 5),
];

export function standardSheetSize(id: string): StandardSheetSize | undefined {
  return STANDARD_SHEET_SIZES.find((size) => size.id === id);
}

/**
 * The standard size these dimensions describe, or undefined for a sheet that is
 * not one of them.
 *
 * Compared within entry tolerance rather than exactly: 8.5 in normalizes to
 * 215.89999999999998 mm, and A4 converted to inches is entered back as
 * "8.27" — both are the same piece of paper as the size they came from. The
 * tolerance is far below the gap between any two listed sizes. Orientation
 * is not inferred — a sheet is the size it was entered as, and a rotated
 * sheet is a different entry.
 */
export function matchStandardSheetSize(
  widthMm: number,
  heightMm: number,
): StandardSheetSize | undefined {
  return STANDARD_SHEET_SIZES.find(
    (size) =>
      measurementsEqual(size.widthMm, widthMm, ENTRY_TOLERANCE_MM) &&
      measurementsEqual(size.heightMm, heightMm, ENTRY_TOLERANCE_MM),
  );
}
