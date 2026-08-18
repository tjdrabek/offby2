import { describe, expect, it } from "vitest";
import { contentBoundary, millimetres } from "../index";
import {
  CUTOFF_LINES,
  NO_CUTOFF_COUNTS,
  cutoffMm,
  cutoffWarnings,
  edgeCutoffAllowance,
  edgeCutoffLadder,
} from "../calibration";

describe("cutoffMm", () => {
  it("reads a missing line as one step of blank paper", () => {
    // Six lines printed, five survived: the outermost 2 mm line was lost,
    // so printing started 2 mm in.
    expect(cutoffMm(5)).toBe(2);
  });

  it("reads no lines at all as the whole ladder blank", () => {
    expect(cutoffMm(0)).toBe(12);
  });

  it("treats a full count as a bound, not a measurement", () => {
    // All six visible says printing reached the innermost line; it cannot
    // say how much closer than one step the printer gets.
    expect(cutoffMm(CUTOFF_LINES)).toBe(0);
  });
});

const margins = {
  topMm: millimetres(12),
  rightMm: millimetres(3.5),
  bottomMm: millimetres(12),
  leftMm: millimetres(3.5),
};

describe("cutoffWarnings", () => {
  it("stays silent while nothing has been counted", () => {
    expect(cutoffWarnings(NO_CUTOFF_COUNTS, margins)).toEqual([]);
  });

  it("stays silent when the dead band stays inside every margin", () => {
    const counts = { top: 6, right: 6, bottom: 6, left: 6 };
    expect(cutoffWarnings(counts, margins)).toEqual([]);
  });

  it("names each edge whose dead band reaches past its margin", () => {
    // Four lines visible = 4 mm blank. Only the 3.5 mm side margins fall
    // short; the 12 mm top and bottom margins keep their rows clear.
    const counts = { top: 4, right: 4, bottom: 4, left: 4 };
    expect(cutoffWarnings(counts, margins)).toEqual([
      { edge: "right", cutoffMm: 4, marginMm: 3.5 },
      { edge: "left", cutoffMm: 4, marginMm: 3.5 },
    ]);
  });

  it("leaves an exactly-covered edge alone", () => {
    // Top: 12 mm blank against a 12 mm margin — the labels start where the
    // printing does, so there is nothing to warn about.
    const counts = { top: 0, right: null, bottom: null, left: null };
    expect(cutoffWarnings(counts, margins)).toEqual([]);
  });
});

describe("edgeCutoffAllowance", () => {
  it("holds nothing on either axis while nothing has been counted", () => {
    expect(edgeCutoffAllowance(NO_CUTOFF_COUNTS, margins)).toEqual({
      axes: "sheet",
      xMm: 0,
      yMm: 0,
    });
  });

  it("holds nothing when the dead band stays inside every margin", () => {
    const counts = { top: 6, right: 6, bottom: 6, left: 6 };
    expect(edgeCutoffAllowance(counts, margins)).toEqual({
      axes: "sheet",
      xMm: 0,
      yMm: 0,
    });
  });

  it("charges each axis only for its own edges", () => {
    // Four lines visible = 4 mm blank. Only the 3.5 mm side margins fall
    // short; the 12 mm top and bottom margins keep the rows untouched.
    const counts = { top: 4, right: 4, bottom: 4, left: 4 };
    const allowance = edgeCutoffAllowance(counts, margins);
    expect(allowance.xMm).toBeCloseTo(0.5, 9);
    expect(allowance.yMm).toBe(0);
  });

  it("takes each axis's worst edge when the pair disagrees", () => {
    // Right: 8 mm blank against 3.5 mm - a 4.5 mm shortfall. Top: 12 mm
    // blank against 12 mm - exactly covered, so the rows still owe nothing.
    const counts = { top: 0, right: 2, bottom: 6, left: 5 };
    const allowance = edgeCutoffAllowance(counts, margins);
    expect(allowance.xMm).toBeCloseTo(4.5, 9);
    expect(allowance.yMm).toBe(0);
  });

  it("is a hold-in line the content boundary accepts, on the sheet's axes", () => {
    // The sides' 0.5 mm shortfall lands on a sideways frame's y axis: the
    // allowance belongs to the paper, and the boundary owns the remap.
    const counts = { top: 4, right: 4, bottom: 4, left: 4 };
    const boundary = contentBoundary(
      { edgeCutoff: edgeCutoffAllowance(counts, margins) },
      { orientation: "sideways", widthMm: 40, heightMm: 30 },
    );
    expect(boundary.xMm).toBe(0);
    expect(boundary.yMm).toBeCloseTo(0.5, 9);
  });
});

describe("edgeCutoffLadder", () => {
  it("runs one ladder in from each edge, one segment per counted line", () => {
    expect(edgeCutoffLadder(210, 297)).toHaveLength(4 * CUTOFF_LINES);
  });

  it("places each line at its counted distance, centred on its edge", () => {
    const ladder = edgeCutoffLadder(210, 297);
    // The top edge's outermost line: 2 mm down, a 14 mm run about mid-width.
    expect(ladder).toContainEqual({
      fromXMm: 98,
      fromYMm: 2,
      toXMm: 112,
      toYMm: 2,
    });
    // The right edge's innermost line: 12 mm in, centred on mid-height.
    expect(ladder).toContainEqual({
      fromXMm: 198,
      fromYMm: 141.5,
      toXMm: 198,
      toYMm: 155.5,
    });
  });
});
