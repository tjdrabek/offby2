/**
 * The counted lines that find where a printing setup stops printing.
 *
 * No consumer printer prints to the edge of the paper. It grips the sheet and
 * leaves a few millimetres blank on each side, and how many is a property of
 * the printing setup that no dialog reports and no browser can ask for. It
 * matters because a label sitting inside that band cannot be printed on at
 * all, and no printer profile can help: a profile moves where content is
 * asked for, never where the printer *stops*.
 *
 * So a short ladder of lines runs in from each edge at a known spacing. The
 * operator counts what survived, and the count gives the distance: the first
 * line to make it through marks the start of the printable area. This module
 * owns the ladder's shape and the reading of its counts, so what a host draws
 * and what the counts mean can never disagree.
 */

import type { HoldInLine } from "../sheet-layouts/contentBoundary.js";
import type { SheetMargins } from "../sheet-layouts/SheetGeometry.js";

/** Spacing between the counted lines. */
export const CUTOFF_STEP_MM = 2;
/** How many lines run in from each edge. */
export const CUTOFF_LINES = 6;
/** Half the length of each counted line, along the edge it sits on. */
export const CUTOFF_RUN_MM = 7;

/** How far in from the edge the printing started, given the lines counted. */
export function cutoffMm(linesVisible: number): number {
  // All six visible means printing reached at least the innermost line; it says
  // nothing about how much closer than 2 mm the printer can get, so the answer
  // is a bound rather than a measurement.
  const missing = Math.max(0, CUTOFF_LINES - linesVisible);
  return missing * CUTOFF_STEP_MM;
}

export type SheetEdge = "top" | "right" | "bottom" | "left";

export const SHEET_EDGES: readonly SheetEdge[] = [
  "top",
  "right",
  "bottom",
  "left",
];

/** The operator's count of surviving lines at each edge; null means uncounted. */
export interface CutoffCounts {
  top: number | null;
  right: number | null;
  bottom: number | null;
  left: number | null;
}

export const NO_CUTOFF_COUNTS: CutoffCounts = {
  top: null,
  right: null,
  bottom: null,
  left: null,
};

export interface CutoffWarning {
  edge: SheetEdge;
  cutoffMm: number;
  marginMm: number;
}

/**
 * Edges where the printing setup's dead band reaches past the margin onto a
 * label.
 *
 * Stated against the margin rather than the sheet, because a blank strip on
 * backing paper costs nothing and the same strip across the first row of
 * labels means those labels cannot be fully printed however well the setup
 * is calibrated.
 */
export function cutoffWarnings(
  counts: CutoffCounts,
  margins: SheetMargins,
): CutoffWarning[] {
  const byEdge: Record<SheetEdge, number> = {
    top: margins.topMm,
    right: margins.rightMm,
    bottom: margins.bottomMm,
    left: margins.leftMm,
  };
  return SHEET_EDGES.flatMap((edge) => {
    const count = counts[edge];
    if (count === null) {
      return [];
    }
    const distanceMm = cutoffMm(count);
    return distanceMm > byEdge[edge]
      ? [{ edge, cutoffMm: distanceMm, marginMm: byEdge[edge] }]
      : [];
  });
}

/**
 * How far in content must be held so the dead band cannot clip it: a hold-in
 * line on the sheet's axes, ready for {@link contentBoundary}.
 *
 * The worst shortfall past a margin, sides and tops separately: on a sheet
 * whose side margins are 3.5 mm and whose printer leaves 4 mm blank, the
 * outer columns lose 0.5 mm however well the setup is calibrated — no
 * profile moves where the printer *stops* — while 12 mm top margins keep the
 * rows untouched, and holding the rows in for the columns' problem would
 * spend room nothing threatens. Applied to every label on the sheet, not
 * only the outer ones, so every label keeps one layout.
 */
export function edgeCutoffAllowance(
  counts: CutoffCounts,
  margins: SheetMargins,
): HoldInLine {
  let xMm = 0;
  let yMm = 0;
  for (const warning of cutoffWarnings(counts, margins)) {
    const deficit = warning.cutoffMm - warning.marginMm;
    if (warning.edge === "left" || warning.edge === "right") {
      xMm = Math.max(xMm, deficit);
    } else {
      yMm = Math.max(yMm, deficit);
    }
  }
  return { axes: "sheet", xMm, yMm };
}

/** The allowance before anything has been counted: a line that holds nothing. */
export const NO_EDGE_CUTOFF: HoldInLine = { axes: "sheet", xMm: 0, yMm: 0 };

/** One counted line on the sheet, in sheet millimetres. */
export interface CutoffLadderLineMm {
  fromXMm: number;
  fromYMm: number;
  toXMm: number;
  toYMm: number;
}

/**
 * All four ladders as plain segments, each at the middle of its edge.
 *
 * The middle, because that is where a sheet is least likely to be gripped or
 * curled, and because it keeps the ladders clear of the corners where a
 * calibration sheet's marks are. Hosts draw these segments as they are —
 * PDF, SVG, canvas — so the ladder an operator counts is the one the counts
 * are read against.
 */
export function edgeCutoffLadder(
  widthMm: number,
  heightMm: number,
): CutoffLadderLineMm[] {
  const midX = widthMm / 2;
  const midY = heightMm / 2;
  const lines: CutoffLadderLineMm[] = [];
  for (let line = 1; line <= CUTOFF_LINES; line += 1) {
    const offset = line * CUTOFF_STEP_MM;
    lines.push(
      across(midX, offset),
      across(midX, heightMm - offset),
      down(offset, midY),
      down(widthMm - offset, midY),
    );
  }
  return lines;
}

/** A counted line lying across the sheet, for the top and bottom ladders. */
function across(midXMm: number, yMm: number): CutoffLadderLineMm {
  return {
    fromXMm: midXMm - CUTOFF_RUN_MM,
    fromYMm: yMm,
    toXMm: midXMm + CUTOFF_RUN_MM,
    toYMm: yMm,
  };
}

/** A counted line running down the sheet, for the left and right ladders. */
function down(xMm: number, midYMm: number): CutoffLadderLineMm {
  return {
    fromXMm: xMm,
    fromYMm: midYMm - CUTOFF_RUN_MM,
    toXMm: xMm,
    toYMm: midYMm + CUTOFF_RUN_MM,
  };
}
