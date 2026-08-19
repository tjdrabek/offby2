import { describe, expect, it } from "vitest";
import { boundaryReadback, type ReadbackFrame, type ReadbackPart } from "../web.js";

/** A stand-in element: the shim's structural slice, no DOM anywhere. */
const fakePart = (
  top: number,
  right: number,
  bottom: number,
  left: number,
): ReadbackPart => ({
  getBoundingClientRect: () => ({ top, right, bottom, left }),
});

const fakeFrame = (
  rect: ReadbackPart,
  padding: { [side: string]: string },
): ReadbackFrame => ({
  ...rect,
  ownerDocument: {
    defaultView: {
      getComputedStyle: () => ({
        paddingTop: padding.top ?? "0px",
        paddingRight: padding.right ?? "0px",
        paddingBottom: padding.bottom ?? "0px",
        paddingLeft: padding.left ?? "0px",
      }),
    },
  },
});

describe("boundaryReadback", () => {
  it("gathers the frame box, its paddings and each part box as plain numbers", () => {
    const readback = boundaryReadback(
      fakeFrame(fakePart(0, 100, 60, 0), {
        top: "10px",
        right: "2.5px",
        bottom: "10px",
        left: "2.5px",
      }),
      "sideways",
      [fakePart(15, 80, 50, 20), fakePart(20, 90, 55, 30)],
    );
    expect(readback).toEqual({
      framePx: { topPx: 0, rightPx: 100, bottomPx: 60, leftPx: 0 },
      paddingPx: { topPx: 10, rightPx: 2.5, bottomPx: 10, leftPx: 2.5 },
      orientation: "sideways",
      partsPx: [
        { topPx: 15, rightPx: 80, bottomPx: 50, leftPx: 20 },
        { topPx: 20, rightPx: 90, bottomPx: 55, leftPx: 30 },
      ],
    });
  });

  it("reads paddings as zero when the element has no window to compute styles in", () => {
    const readback = boundaryReadback(
      { ...fakePart(0, 100, 60, 0), ownerDocument: { defaultView: null } },
      "upright",
      [],
    );
    expect(readback.paddingPx).toEqual({
      topPx: 0,
      rightPx: 0,
      bottomPx: 0,
      leftPx: 0,
    });
  });
});
