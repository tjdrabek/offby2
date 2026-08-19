/**
 * The content boundary restated for a proportional renderer: each held
 * distance as a percentage of the frame extent it is held out of.
 *
 * A container-unit stylesheet sizes in hundredths of its container — `1cqw`
 * is one percent of the frame's width — so a percentage is the one number it
 * can use without converting anything. The division lives here so the
 * adapters that hand these numbers on (`offby2/web`) carry no arithmetic at
 * all, and there is exactly one place a percent can be computed wrongly.
 *
 * This module is pure: it imports no React, DOM, or framework types.
 */

import {
  contentBoundary,
  type DesignFrame,
  type FrameDistancesMm,
  type HoldInLine,
} from "./contentBoundary.js";

/** A held distance per design-frame axis, as a percentage of that extent. */
export interface FramePercents {
  xPercent: number;
  yPercent: number;
}

export interface ContentBoundaryPercents extends FramePercents {
  /** Each line's own held distance, restated the same way. */
  lines: { [name: string]: FramePercents };
}

/**
 * The content boundary for a design frame, as percentages of its extents:
 * one engine call answering the content stop and every guide line's own
 * position, already in the numbers a proportional stylesheet multiplies.
 */
export function contentBoundaryPercents(
  lines: { [name: string]: HoldInLine },
  frame: DesignFrame,
): ContentBoundaryPercents {
  const boundary = contentBoundary(lines, frame);
  const held: { [name: string]: FramePercents } = {};
  for (const [name, line] of Object.entries(boundary.lines)) {
    held[name] = percents(line, frame);
  }
  return { ...percents(boundary, frame), lines: held };
}

function percents(
  distances: FrameDistancesMm,
  frame: DesignFrame,
): FramePercents {
  return {
    xPercent: percentOf(distances.xMm, frame.widthMm),
    yPercent: percentOf(distances.yMm, frame.heightMm),
  };
}

/** A length as a percentage of an extent; zero when there is no extent. */
function percentOf(valueMm: number, extentMm: number): number {
  return extentMm > 0 ? (valueMm / extentMm) * 100 : 0;
}
