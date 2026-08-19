/**
 * The element readback shim: numbers out of a rendered frame element, into
 * the shape the core's pixel agreement check judges.
 *
 * The shim only gathers — box positions from `getBoundingClientRect`,
 * paddings from the element's computed style — and hands the plain numbers
 * to `judgeBoundaryAgreement` (from `offby2`) to do all the judging. The
 * element types are structural slices of the DOM's, so the package keeps no
 * DOM type dependency and the shim is testable with plain objects.
 */

import type {
  BoundaryReadback,
  EdgesPx,
} from "../sheet-layouts/boundaryAgreement.js";
import type { DesignFrame } from "../sheet-layouts/contentBoundary.js";

/** The slice of an element a part reading needs. Any DOM element fits. */
export interface ReadbackPart {
  getBoundingClientRect(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/** The slice of an element a frame reading needs. Any DOM element fits. */
export interface ReadbackFrame extends ReadbackPart {
  ownerDocument: {
    defaultView: {
      getComputedStyle(element: ReadbackPart): {
        paddingTop: string;
        paddingRight: string;
        paddingBottom: string;
        paddingLeft: string;
      };
    } | null;
  };
}

/**
 * Gathers a readback from a rendered frame element and its content parts.
 *
 * The orientation is the caller's: it is design state, not something an
 * element can be asked for. An element detached from any window has no
 * computed style; its paddings read as zero.
 */
export function boundaryReadback(
  frame: ReadbackFrame,
  orientation: DesignFrame["orientation"],
  parts: readonly ReadbackPart[],
): BoundaryReadback {
  const style = frame.ownerDocument.defaultView?.getComputedStyle(frame);
  return {
    framePx: boxEdges(frame),
    paddingPx: {
      topPx: px(style?.paddingTop),
      rightPx: px(style?.paddingRight),
      bottomPx: px(style?.paddingBottom),
      leftPx: px(style?.paddingLeft),
    },
    orientation,
    partsPx: parts.map(boxEdges),
  };
}

function boxEdges(element: ReadbackPart): EdgesPx {
  const rect = element.getBoundingClientRect();
  return {
    topPx: rect.top,
    rightPx: rect.right,
    bottomPx: rect.bottom,
    leftPx: rect.left,
  };
}

/** A computed length's number; zero when there is nothing to read. */
function px(value: string | undefined): number {
  const parsed = value === undefined ? 0 : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
