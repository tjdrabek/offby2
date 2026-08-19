import { describe, expect, it } from "vitest";
import {
  AGREES,
  SUBPIXEL_TOLERANCE_PX,
  judgeBoundaryAgreement,
  onScreenEdges,
  type BoundaryReadback,
  type EdgesPx,
} from "../index.js";

const edges = (
  topPx: number,
  rightPx: number,
  bottomPx: number,
  leftPx: number,
): EdgesPx => ({ topPx, rightPx, bottomPx, leftPx });

/** A 100×60 px frame at the origin with 10 px of padding all round. */
const evenReadback = (partsPx: EdgesPx[]): BoundaryReadback => ({
  framePx: edges(0, 100, 60, 0),
  paddingPx: edges(10, 10, 10, 10),
  orientation: "upright",
  partsPx,
});

describe("onScreenEdges", () => {
  it("leaves an upright element's edges where they are", () => {
    const padding = edges(1, 2, 3, 4);
    expect(onScreenEdges(padding, "upright")).toEqual(padding);
  });

  it("reassigns a sideways element's edges the way the quarter turn lands them", () => {
    // Turned counterclockwise: the element's right edge lands on the screen's
    // top, bottom on right, left on bottom, top on left.
    expect(onScreenEdges(edges(1, 2, 3, 4), "sideways")).toEqual(
      edges(2, 3, 4, 1),
    );
  });

  it("is its own inverse over four applications", () => {
    const once = onScreenEdges(edges(1, 2, 3, 4), "sideways");
    const twice = onScreenEdges(once, "sideways");
    const thrice = onScreenEdges(twice, "sideways");
    expect(onScreenEdges(thrice, "sideways")).toEqual(edges(1, 2, 3, 4));
  });
});

describe("judgeBoundaryAgreement", () => {
  it("agrees when every part sits inside the padding box", () => {
    const judgement = judgeBoundaryAgreement(
      evenReadback([edges(15, 80, 50, 20)]),
    );
    expect(judgement).toEqual(AGREES);
  });

  it("agrees when nothing was rendered to measure", () => {
    expect(judgeBoundaryAgreement(evenReadback([]))).toEqual(AGREES);
  });

  it("reports a part crossing the right edge as width overflow", () => {
    const judgement = judgeBoundaryAgreement(
      evenReadback([edges(15, 95, 50, 20)]),
    );
    expect(judgement.agrees).toBe(false);
    expect(judgement.axis).toBe("width");
    expect(judgement.overflowPx).toBe(5);
    // Against the 80 px-wide padding box, so any measured size agrees.
    expect(judgement.overflowRatio).toBeCloseTo(5 / 80);
  });

  it("reports both axes when a part escapes in both directions", () => {
    const judgement = judgeBoundaryAgreement(
      evenReadback([edges(5, 95, 50, 20)]),
    );
    expect(judgement.axis).toBe("both");
  });

  it("keeps the worst overflow across all parts", () => {
    const judgement = judgeBoundaryAgreement(
      evenReadback([edges(15, 93, 50, 20), edges(15, 97, 50, 20)]),
    );
    expect(judgement.overflowPx).toBe(7);
  });

  it("lets sub-pixel rounding pass as agreement", () => {
    const judgement = judgeBoundaryAgreement(
      evenReadback([edges(15, 90 + SUBPIXEL_TOLERANCE_PX, 50, 20)]),
    );
    expect(judgement.agrees).toBe(true);
    expect(judgement.axis).toBe("none");
  });

  it("judges a sideways element's unequal paddings against the screen edges they land on", () => {
    // The element's 20 px top padding lands on the screen's left. A part
    // sitting 12 px in from the frame's left crosses that line by 8 px; the
    // hand-written demo mapping this replaces would have judged it against
    // the 2 px that landed there from the element's left padding and let a
    // real overflow pass.
    const judgement = judgeBoundaryAgreement({
      framePx: edges(0, 60, 100, 0),
      paddingPx: { topPx: 20, rightPx: 2, bottomPx: 2, leftPx: 2 },
      orientation: "sideways",
      partsPx: [edges(10, 50, 90, 12)],
    });
    expect(judgement.agrees).toBe(false);
    expect(judgement.axis).toBe("width");
    expect(judgement.overflowPx).toBe(8);
  });

  it("takes a caller's own tolerance", () => {
    const readback = evenReadback([edges(15, 92, 50, 20)]);
    expect(judgeBoundaryAgreement(readback, 3).agrees).toBe(true);
    expect(judgeBoundaryAgreement(readback, 1).agrees).toBe(false);
  });
});
