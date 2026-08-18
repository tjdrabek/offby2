/**
 * Where label content stops: the content boundary.
 *
 * Several things hold content in from the label boundary — a design's content
 * inset, a printing setup's edge cut-off allowance, an alignment tolerance.
 * They do not add: each hold-in is a line, and content stops at whichever
 * sits furthest in, per axis.
 *
 * A line declares which axes it lives on. A content inset turns with the
 * design frame; an edge cut-off allowance belongs to the paper and stays on
 * the sheet's axes. Mapping one onto the other is this module's job and no
 * caller's: the sheet-axis→frame-axis remap and the half-extent clamp happen
 * here, exactly once.
 *
 * This module is pure: it imports no React, DOM, or framework types.
 */

/** Which axes a hold-in line's distances are declared on. */
export type HoldInAxes = "sheet" | "frame";

/**
 * A named distance that keeps label content in from the label boundary.
 *
 * `xMm` and `yMm` are read on the declared axes: for `"frame"` they follow
 * the design frame and turn with it; for `"sheet"` they stay with the paper,
 * x across the sheet and y down it, whichever way the frame is turned.
 */
export interface HoldInLine {
  axes: HoldInAxes;
  xMm: number;
  yMm: number;
}

/** The dimensions the design is laid out in, and which way it sits on the label. */
export interface DesignFrame {
  orientation: "upright" | "sideways";
  widthMm: number;
  heightMm: number;
}

/** A distance per design-frame axis. */
export interface FrameDistancesMm {
  xMm: number;
  yMm: number;
}

export interface ContentBoundary extends FrameDistancesMm {
  /**
   * Each line's own held distance, remapped and clamped exactly as the
   * boundary was — so a guide line can be drawn at its true position,
   * including when lines cross, without recomputing anything.
   */
  lines: { [name: string]: FrameDistancesMm };
}

/**
 * The least room a clamped line leaves open in the middle of an axis: half
 * a millimetre per side, so "less than half the extent" is strict and a
 * fully-clamped frame still has a sliver to place content in.
 */
const CENTRE_GAP_MM = 0.5;

/**
 * A distance held to less than half the extent it is taken out of.
 *
 * Each axis is held against its own extent, not the smaller of the two: a
 * frame narrow enough for its lines to meet in the middle still has room
 * down its length, and clamping both to the smaller would throw that room
 * away.
 */
function heldMm(distanceMm: number, extentMm: number): number {
  return Math.max(0, Math.min(distanceMm, extentMm / 2 - CENTRE_GAP_MM));
}

/**
 * The content boundary for a design frame, given a set of named hold-in
 * lines: the most obtrusive held line per frame axis, and each line's own
 * held distance.
 */
export function contentBoundary(
  lines: { [name: string]: HoldInLine },
  frame: DesignFrame,
): ContentBoundary {
  const held: { [name: string]: FrameDistancesMm } = {};
  let xMm = 0;
  let yMm = 0;
  for (const [name, line] of Object.entries(lines)) {
    // A quarter turn runs the frame's x along the sheet's y: sheet-axis
    // distances swap onto a sideways frame, frame-axis ones already turned.
    const swap = line.axes === "sheet" && frame.orientation === "sideways";
    const lineHeld: FrameDistancesMm = {
      xMm: heldMm(swap ? line.yMm : line.xMm, frame.widthMm),
      yMm: heldMm(swap ? line.xMm : line.yMm, frame.heightMm),
    };
    held[name] = lineHeld;
    xMm = Math.max(xMm, lineHeld.xMm);
    yMm = Math.max(yMm, lineHeld.yMm);
  }
  return { xMm, yMm, lines: held };
}
