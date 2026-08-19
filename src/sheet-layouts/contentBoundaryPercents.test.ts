import { describe, expect, it } from "vitest";
import { contentBoundary, contentBoundaryPercents } from "../index";
import type { DesignFrame, HoldInLine } from "../index";

const frame: DesignFrame = {
  orientation: "upright",
  widthMm: 40,
  heightMm: 20,
};

describe("contentBoundaryPercents", () => {
  it("states the boundary and each line as percentages of the frame extents", () => {
    const percents = contentBoundaryPercents(
      {
        padding: { axes: "frame", xMm: 4, yMm: 1 },
        cutoff: { axes: "sheet", xMm: 2, yMm: 3 },
      },
      frame,
    );
    expect(percents.xPercent).toBe(10);
    expect(percents.yPercent).toBe(15);
    expect(percents.lines).toEqual({
      padding: { xPercent: 10, yPercent: 5 },
      cutoff: { xPercent: 5, yPercent: 15 },
    });
  });

  it("answers exactly as contentBoundary does, restated per extent", () => {
    // One engine call: the percents are the boundary's own held answers, so a
    // stylesheet drawing from them can never disagree with the boundary.
    const lines: { [name: string]: HoldInLine } = {
      padding: { axes: "frame", xMm: 3, yMm: 2 },
      cutoff: { axes: "sheet", xMm: 5, yMm: 1 },
    };
    const sideways: DesignFrame = { ...frame, orientation: "sideways" };
    const boundary = contentBoundary(lines, sideways);
    const percents = contentBoundaryPercents(lines, sideways);
    expect(percents.xPercent).toBe((boundary.xMm / sideways.widthMm) * 100);
    expect(percents.yPercent).toBe((boundary.yMm / sideways.heightMm) * 100);
  });

  it("answers zero for a degenerate extent rather than dividing by it", () => {
    const percents = contentBoundaryPercents(
      { padding: { axes: "frame", xMm: 1, yMm: 1 } },
      { orientation: "upright", widthMm: 0, heightMm: 20 },
    );
    expect(percents.xPercent).toBe(0);
    expect(percents.lines.padding.xPercent).toBe(0);
  });
});
