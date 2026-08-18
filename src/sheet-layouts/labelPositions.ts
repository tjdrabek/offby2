/**
 * Label positions on a sheet, in sheet coordinates.
 *
 * Geometry says how big the parts are; this module says where each label
 * lands. It is the value a preview, a PDF writer, or a position picker all
 * need, and none of them should be recomputing the pitch themselves.
 *
 * The origin is the top-left corner of the sheet, x increasing to the right
 * and y increasing downwards, matching both SVG and PDF-with-flipped-y
 * conventions after a single transform rather than per-label arithmetic.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  cornerRadiusMm,
  type Millimetres,
  type SheetGeometry,
} from "./SheetGeometry";
import { labelTracks } from "./validateSheetGeometry";
import {
  correctedPoint,
  type PrinterProfile,
} from "../calibration/PrinterProfile";

/** One label's boundary on the sheet. */
export interface LabelPosition {
  /** Zero-based reading-order index: left to right, then top to bottom. */
  index: number;
  /** Zero-based row, from the top margin. */
  row: number;
  /** Zero-based column, from the left margin. */
  column: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  /**
   * The disclosed corner radius, or null when the geometry makes no radius
   * claim. A renderer must decide what to draw for null rather than being
   * handed a zero that silently asserts square corners.
   */
  cornerRadiusMm: number | null;
}

/**
 * Every label boundary the geometry describes, in reading order.
 *
 * The geometry is assumed to have been accepted by validateSheetGeometry; a
 * refused geometry still produces positions here, they are simply positions of
 * a sheet that cannot exist.
 *
 * With a `profile`, the positions are corrected for that printing setup's
 * measured placement bias — the positions to *send to the printer* so that the
 * ink lands on the labels. Without one, they are the intended positions, which
 * is what a preview of the sheet itself should show. The two differ by the
 * profile's translation and nothing else.
 */
export function labelPositions(
  geometry: SheetGeometry,
  profile?: PrinterProfile,
): LabelPosition[] {
  const columns = labelTracks(
    geometry.margins.leftMm,
    geometry.label.widthMm,
    geometry.gaps.horizontalMm,
    geometry.grid.columns,
  );
  const rows = labelTracks(
    geometry.margins.topMm,
    geometry.label.heightMm,
    geometry.gaps.verticalMm,
    geometry.grid.rows,
  );
  const radiusMm = cornerRadiusMm(geometry.cornerRadius);

  const positions: LabelPosition[] = [];
  for (const row of rows) {
    for (const column of columns) {
      // Correction goes through correctedPoint rather than adding the
      // translation here, so the sign convention has exactly one implementation.
      const point = profile
        ? correctedPoint(profile, column.startMm, row.startMm)
        : { xMm: column.startMm, yMm: row.startMm };
      positions.push({
        index: positions.length,
        row: row.index,
        column: column.index,
        xMm: point.xMm,
        yMm: point.yMm,
        widthMm: geometry.label.widthMm,
        heightMm: geometry.label.heightMm,
        cornerRadiusMm: radiusMm,
      });
    }
  }
  return positions;
}

/** Total labels on one sheet. */
export function labelCount(geometry: SheetGeometry): number {
  return geometry.grid.rows * geometry.grid.columns;
}

/**
 * The region inside a label boundary that content must stay within, given an
 * alignment tolerance and an optional content inset.
 *
 * The two are additive and independent by design: the tolerance is what the
 * printing setup cannot guarantee, the inset is what the composition chooses.
 * Collapsing them into one number loses the ability to say which one is
 * responsible when content will not fit.
 *
 * @deprecated The additive model this computes contradicts the content
 * boundary's rule that hold-in lines do not add. Pass the tolerance and the
 * inset to `contentBoundary` as named hold-in lines instead; this function
 * will be reimplemented on the boundary or removed once the demo no longer
 * calls it.
 */
export function safeArea(
  position: LabelPosition,
  alignmentToleranceMm: number,
  contentInsetMm = 0,
): { xMm: number; yMm: number; widthMm: number; heightMm: number } | null {
  const inset = alignmentToleranceMm + contentInsetMm;
  const widthMm = position.widthMm - inset * 2;
  const heightMm = position.heightMm - inset * 2;
  // A tolerance wider than the label leaves nothing to place content in. That
  // is a real answer about the printing setup, not a zero-sized rectangle.
  if (widthMm <= 0 || heightMm <= 0) {
    return null;
  }
  return {
    xMm: position.xMm + inset,
    yMm: position.yMm + inset,
    widthMm,
    heightMm,
  };
}

/** The sheet's own extent, for a renderer sizing its canvas or viewBox. */
export function sheetExtent(geometry: SheetGeometry): {
  widthMm: Millimetres;
  heightMm: Millimetres;
} {
  return {
    widthMm: geometry.sheet.widthMm,
    heightMm: geometry.sheet.heightMm,
  };
}
