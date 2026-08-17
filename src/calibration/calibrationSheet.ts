/**
 * The marks a calibration sheet carries, and where they are meant to land.
 *
 * A calibration sheet exists to answer one question: when this printing setup
 * is asked to put content at a known place on the sheet, where does it actually
 * put it? So every mark has an intended position stated in sheet coordinates,
 * and the operator's job is to measure where the printed mark really is.
 *
 * The marks sit at the centres of the grid's corner labels rather than at
 * arbitrary points on the sheet. Three reasons: ink lands on label stock rather
 * than on the backing sheet, the marks measure the thing actually being
 * corrected, and no placement rule is needed to keep them clear of the labels.
 *
 * More than one mark is used on purpose. A single mark cannot tell a sheet that
 * was shifted from one that was also scaled or rotated, and this package only
 * corrects translation (see derivePrinterProfile.ts). Marks at opposite corners
 * make that difference visible instead of averaging it away.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import type { SheetGeometry } from "./../sheet-layouts/SheetGeometry";
import { labelPositions } from "./../sheet-layouts/labelPositions";

/** One mark, and the position on the sheet it is meant to be printed at. */
export interface CalibrationTarget {
  /** Stable across regenerations of the same sheet, so an observation can name it. */
  id: string;
  /** How the position is described to an operator, e.g. "top-left label". */
  label: string;
  /** Zero-based grid position the mark sits on. */
  row: number;
  column: number;
  /** Intended centre, measured from the sheet's left edge and top edge. */
  intendedXMm: number;
  intendedYMm: number;
}

export interface CalibrationSheetPlan {
  sheet: { widthMm: number; heightMm: number };
  targets: readonly CalibrationTarget[];
  /**
   * Length of each crosshair arm, for a renderer. Sized to the smallest label
   * so a mark cannot spill past the label it identifies.
   */
  markLengthMm: number;
}

/** Preferred crosshair arm length, before it is bounded by the label size. */
const PREFERRED_MARK_LENGTH_MM = 10;

/** A mark shorter than this is too small to measure to reliably. */
const MIN_MARK_LENGTH_MM = 2;

function targetLabel(row: number, column: number, rows: number, columns: number) {
  const vertical = rows === 1 ? "" : row === 0 ? "top " : "bottom ";
  const horizontal = columns === 1 ? "" : column === 0 ? "left" : "right";
  const name = `${vertical}${horizontal}`.trim();
  return name.length > 0 ? `${name} label` : "the only label";
}

/**
 * The calibration marks for one sheet layout.
 *
 * Up to four marks, at the corners of the grid. A single row or column yields
 * fewer, and a one-label sheet yields exactly one — which is enough to observe
 * a shift but not enough to tell a shift from a scaling, and derivation says so
 * rather than pretending otherwise.
 */
export function calibrationSheet(
  geometry: SheetGeometry,
): CalibrationSheetPlan {
  const positions = labelPositions(geometry);
  const lastRow = geometry.grid.rows - 1;
  const lastColumn = geometry.grid.columns - 1;

  // A set, because a single row or column makes the corners coincide.
  const corners = new Set([
    `0:0`,
    `0:${lastColumn}`,
    `${lastRow}:0`,
    `${lastRow}:${lastColumn}`,
  ]);

  const targets = positions
    .filter((position) => corners.has(`${position.row}:${position.column}`))
    .map((position) => ({
      id: `r${position.row}c${position.column}`,
      label: targetLabel(
        position.row,
        position.column,
        geometry.grid.rows,
        geometry.grid.columns,
      ),
      row: position.row,
      column: position.column,
      intendedXMm: position.xMm + position.widthMm / 2,
      intendedYMm: position.yMm + position.heightMm / 2,
    }));

  return {
    sheet: {
      widthMm: geometry.sheet.widthMm,
      heightMm: geometry.sheet.heightMm,
    },
    targets,
    markLengthMm: markLengthFor(geometry),
  };
}

/**
 * The crosshair arm length, bounded so a mark stays within its label.
 *
 * Half the smaller label dimension is the most that fits from the centre; the
 * mark is kept a little inside that so a small placement error does not make it
 * ambiguous which label a mark belongs to.
 */
function markLengthFor(geometry: SheetGeometry): number {
  const smallest = Math.min(
    geometry.label.widthMm,
    geometry.label.heightMm,
  );
  const fits = smallest * 0.6;
  return Math.max(MIN_MARK_LENGTH_MM, Math.min(PREFERRED_MARK_LENGTH_MM, fits));
}
