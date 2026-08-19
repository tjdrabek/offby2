/**
 * The marks a calibration sheet carries, and where they are meant to land.
 *
 * A calibration sheet exists to answer one question: when this printing setup
 * is asked to put content at a known place on the sheet, where does it actually
 * put it? So every mark has an intended position stated in sheet coordinates,
 * and the operator's job is to measure where the printed mark really is.
 *
 * More than one mark is used on purpose. A single mark cannot tell a sheet that
 * was shifted from one that was also scaled or rotated, and this package only
 * corrects translation (see derivePrinterProfile.ts). Marks at opposite corners
 * make that difference visible instead of averaging it away.
 *
 * Where exactly those marks sit is a choice, named by a {@link MarkPlacement}
 * and recorded on the plan so a scene or a set of printed directions can branch
 * on the plan alone rather than reimplementing the choice:
 *
 * - `corner-label-centre` (the default) puts marks at the centres of the
 *   grid's corner labels. Ink lands on label stock rather than on the backing
 *   sheet, the marks measure the thing actually being corrected, and no
 *   placement rule is needed to keep them clear of the labels. What it costs:
 *   the targets are whatever the layout happens to make them — different on
 *   every sheet, unequal between axes, and on a dense layout close enough to
 *   the paper's edge that the printer may not print them at all.
 * - `sheet-corner` puts marks at one shared, round distance from the two sheet
 *   edges each is measured from, independent of the grid. An operator lays a
 *   rule against an edge and reads one figure four times; any mark that is not
 *   that figure is the amount it moved. What it costs: the marks fall on
 *   whatever the sheet is made of at that point, which is backing paper for
 *   most layouts rather than a label.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import type { SheetGeometry } from "./../sheet-layouts/SheetGeometry";
import { labelPositions } from "./../sheet-layouts/labelPositions";

export type MarkPlacement = "corner-label-centre" | "sheet-corner";

/** One mark, and the position on the sheet it is meant to be printed at. */
export interface CalibrationTarget {
  /** Stable across regenerations of the same sheet, so an observation can name it. */
  id: string;
  /** How the position is described to an operator, e.g. "top-left label". */
  label: string;
  /**
   * Zero-based grid position the mark sits on, where that means something —
   * only under `corner-label-centre`. A `sheet-corner` mark belongs to the
   * sheet rather than to a label and carries no grid position.
   */
  row?: number;
  column?: number;
  /** Intended centre, measured from the sheet's left edge and top edge. */
  intendedXMm: number;
  intendedYMm: number;
}

export interface CalibrationSheetPlan {
  /** Which choice of mark placement produced this plan. */
  placement: MarkPlacement;
  sheet: { widthMm: number; heightMm: number };
  targets: readonly CalibrationTarget[];
  /**
   * Length of each crosshair arm, for a renderer. Sized so a mark cannot spill
   * past whatever bounds it — the label it identifies under
   * `corner-label-centre`, or its own inset from the sheet edge under
   * `sheet-corner`.
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
 * Marks at the centres of the grid's corner labels.
 *
 * Up to four marks, at the corners of the grid. A single row or column yields
 * fewer, and a one-label sheet yields exactly one — which is enough to observe
 * a shift but not enough to tell a shift from a scaling, and derivation says so
 * rather than pretending otherwise.
 */
function cornerLabelCentrePlan(geometry: SheetGeometry): CalibrationSheetPlan {
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
    placement: "corner-label-centre",
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

/** Tried in order: the first that leaves the marks well apart is used. */
const SHEET_CORNER_INSETS_MM = [30, 25, 20, 15, 10];

/** Kept between the two marks on an axis, so they cannot be mistaken for each other. */
const SHEET_CORNER_MIN_SEPARATION_MM = 40;

/** Arm to arm. Long enough to sight a rule along, short enough to stay put. */
const SHEET_CORNER_MARK_LENGTH_MM = 10;

const SHEET_CORNERS = [
  { id: "tl", label: "top-left mark", row: 0, column: 0 },
  { id: "tr", label: "top-right mark", row: 0, column: 1 },
  { id: "bl", label: "bottom-left mark", row: 1, column: 0 },
  { id: "br", label: "bottom-right mark", row: 1, column: 1 },
] as const;

/**
 * Four marks at the largest round inset the sheet can hold, sharing one
 * distance from the two edges each is measured from.
 *
 * The largest of a preferred list of round numbers that still keeps the marks
 * a minimum distance apart on the sheet's shorter axis is used, so the marks
 * sit as far apart as a tidy number allows — the further apart they are, the
 * more clearly a stretched or rotated print shows up as marks that disagree.
 * A sheet too small for the smallest preferred inset falls back to a quarter
 * of its shorter axis, floored so the inset is never zero.
 */
function sheetCornerPlan(geometry: SheetGeometry): CalibrationSheetPlan {
  const widthMm = geometry.sheet.widthMm;
  const heightMm = geometry.sheet.heightMm;
  const smallest = Math.min(widthMm, heightMm);
  const insetMm =
    SHEET_CORNER_INSETS_MM.find(
      (inset) => inset * 2 + SHEET_CORNER_MIN_SEPARATION_MM <= smallest,
    ) ?? Math.max(2, Math.floor(smallest / 4));

  const targets: CalibrationTarget[] = SHEET_CORNERS.map((corner) => ({
    id: corner.id,
    label: corner.label,
    intendedXMm: corner.column === 0 ? insetMm : widthMm - insetMm,
    intendedYMm: corner.row === 0 ? insetMm : heightMm - insetMm,
  }));

  return {
    placement: "sheet-corner",
    sheet: { widthMm, heightMm },
    targets,
    markLengthMm: Math.min(SHEET_CORNER_MARK_LENGTH_MM, insetMm),
  };
}

/**
 * The calibration marks for one sheet layout, under the given placement.
 *
 * Omitting `placement` reproduces today's plans exactly: the
 * `corner-label-centre` placement is the default, unchanged for every
 * existing caller.
 */
export function calibrationSheet(
  geometry: SheetGeometry,
  placement: MarkPlacement = "corner-label-centre",
): CalibrationSheetPlan {
  return placement === "sheet-corner"
    ? sheetCornerPlan(geometry)
    : cornerLabelCentrePlan(geometry);
}
