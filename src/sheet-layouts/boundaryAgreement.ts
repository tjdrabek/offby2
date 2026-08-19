/**
 * Whether rendered content agrees with the content boundary: the pixel
 * agreement check.
 *
 * A browser lays a label out itself, and container-unit layouts never
 * report running out of room — overflow is silently clipped, and clipped
 * content on adhesive paper is found thirty labels too late. So the
 * rendering is read back and judged: each part's on-screen box against the
 * box the frame element's paddings leave, in whatever pixels the reading
 * was taken in.
 *
 * A sideways design is turned a quarter turn on screen, which lands each of
 * the element's own edges on a different screen edge. Boxes are read after
 * the turn; paddings belong to the element and are read before it. The
 * reassignment between the two is this module's job and no caller's: judged
 * without it, unequal paddings are held against the wrong screen edges and
 * one direction refuses changes the label has room for.
 *
 * This module is pure: plain numbers in, a judgement out. Gathering the
 * numbers from a live element is `offby2/web`'s job.
 */

import type { DesignFrame } from "./contentBoundary";

/**
 * A value read at each screen edge: a box's edge positions, or distances in
 * from each edge, in whatever pixels the reading was taken in.
 */
export interface EdgesPx {
  topPx: number;
  rightPx: number;
  bottomPx: number;
  leftPx: number;
}

/**
 * An element's own edge values, reassigned to the screen edges they land on
 * once the frame is turned.
 *
 * The sideways turn is counterclockwise, so the element's right edge lands
 * on the screen's top, bottom on right, left on bottom, and top on left —
 * the same quarter turn the stylesheet and the printable output draw.
 */
export function onScreenEdges(
  edges: EdgesPx,
  orientation: DesignFrame["orientation"],
): EdgesPx {
  return orientation === "sideways"
    ? {
        topPx: edges.rightPx,
        rightPx: edges.bottomPx,
        bottomPx: edges.leftPx,
        leftPx: edges.topPx,
      }
    : edges;
}

/** What a readback gathered from a rendered frame element and its parts. */
export interface BoundaryReadback {
  /** The frame element's box, as edge positions on screen. */
  framePx: EdgesPx;
  /** The element's own paddings, before any turn. */
  paddingPx: EdgesPx;
  orientation: DesignFrame["orientation"];
  /** Each content part's box, as edge positions on screen. */
  partsPx: EdgesPx[];
}

export interface BoundaryAgreement {
  agrees: boolean;
  /** Worst overflow in pixels, at whatever size the reading was taken. */
  overflowPx: number;
  /** The same overflow as a fraction of the box, which any size agrees on. */
  overflowRatio: number;
  /** Which way the content ran out of room, for saying so. */
  axis: "width" | "height" | "both" | "none";
}

/** The judgement when everything sits where the boundary allows. */
export const AGREES: BoundaryAgreement = {
  agrees: true,
  overflowPx: 0,
  overflowRatio: 0,
  axis: "none",
};

/** Sub-pixel slack, so rounding alone never reads as an overflow. */
export const SUBPIXEL_TOLERANCE_PX = 0.75;

/**
 * Judges a readback: does the rendered content agree with the boundary the
 * frame element's paddings encode?
 *
 * The ratio is stated against the padding box rather than the screen, so
 * the figure means the same thing whatever size the reading was taken at.
 */
export function judgeBoundaryAgreement(
  readback: BoundaryReadback,
  tolerancePx: number = SUBPIXEL_TOLERANCE_PX,
): BoundaryAgreement {
  const pad = onScreenEdges(readback.paddingPx, readback.orientation);
  const box: EdgesPx = {
    topPx: readback.framePx.topPx + pad.topPx,
    rightPx: readback.framePx.rightPx - pad.rightPx,
    bottomPx: readback.framePx.bottomPx - pad.bottomPx,
    leftPx: readback.framePx.leftPx + pad.leftPx,
  };

  let overflowX = 0;
  let overflowY = 0;
  for (const part of readback.partsPx) {
    overflowX = Math.max(
      overflowX,
      box.leftPx - part.leftPx,
      part.rightPx - box.rightPx,
    );
    overflowY = Math.max(
      overflowY,
      box.topPx - part.topPx,
      part.bottomPx - box.bottomPx,
    );
  }

  const wide = overflowX > tolerancePx;
  const tall = overflowY > tolerancePx;
  if (!wide && !tall) {
    return AGREES;
  }
  const boxWidth = Math.max(1, box.rightPx - box.leftPx);
  const boxHeight = Math.max(1, box.bottomPx - box.topPx);
  return {
    agrees: false,
    overflowPx: Math.max(0, overflowX, overflowY),
    overflowRatio: Math.max(0, overflowX / boxWidth, overflowY / boxHeight),
    axis: wide && tall ? "both" : wide ? "width" : "height",
  };
}
