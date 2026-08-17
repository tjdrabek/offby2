import { describe, expect, it } from "vitest";
import { millimetres, type SheetGeometry } from "../sheet-layouts/SheetGeometry";
import { calibrationSheet } from "./calibrationSheet";

function geometry(overrides: Partial<SheetGeometry> = {}): SheetGeometry {
  return {
    sheet: { widthMm: millimetres(100), heightMm: millimetres(80) },
    grid: { rows: 2, columns: 3 },
    label: { widthMm: millimetres(20), heightMm: millimetres(30) },
    margins: {
      topMm: millimetres(5),
      rightMm: millimetres(15),
      bottomMm: millimetres(35),
      leftMm: millimetres(10),
    },
    gaps: { horizontalMm: millimetres(2.5), verticalMm: millimetres(10) },
    cornerRadius: { state: "zero" },
    ...overrides,
  };
}

describe("calibrationSheet", () => {
  it("marks the four corners of the grid", () => {
    const plan = calibrationSheet(geometry());

    expect(plan.targets.map((target) => [target.row, target.column])).toEqual([
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 2],
    ]);
  });

  it("places each mark at the centre of its label", () => {
    const plan = calibrationSheet(geometry());
    const [topLeft] = plan.targets;

    // Label starts at the left/top margin and is 20 x 30.
    expect(topLeft.intendedXMm).toBe(20);
    expect(topLeft.intendedYMm).toBe(20);
  });

  it("carries the sheet extent for a renderer", () => {
    expect(calibrationSheet(geometry()).sheet).toEqual({
      widthMm: 100,
      heightMm: 80,
    });
  });

  it("gives every mark a distinct id", () => {
    const ids = calibrationSheet(geometry()).targets.map((one) => one.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names each mark by where it sits", () => {
    const plan = calibrationSheet(geometry());

    expect(plan.targets.map((one) => one.label)).toEqual([
      "top left label",
      "top right label",
      "bottom left label",
      "bottom right label",
    ]);
  });

  describe("degenerate grids", () => {
    it("marks two labels on a single row", () => {
      const plan = calibrationSheet(
        geometry({ grid: { rows: 1, columns: 3 } }),
      );

      expect(plan.targets).toHaveLength(2);
      expect(plan.targets.map((one) => one.label)).toEqual([
        "left label",
        "right label",
      ]);
    });

    it("marks two labels on a single column", () => {
      const plan = calibrationSheet(
        geometry({ grid: { rows: 2, columns: 1 } }),
      );

      expect(plan.targets).toHaveLength(2);
      expect(plan.targets.map((one) => one.label)).toEqual([
        "top label",
        "bottom label",
      ]);
    });

    it("marks the only label on a one-label sheet", () => {
      const plan = calibrationSheet(
        geometry({ grid: { rows: 1, columns: 1 } }),
      );

      // Enough to observe a shift, and derivation will not pretend one mark
      // can distinguish a shift from a scaling.
      expect(plan.targets).toHaveLength(1);
      expect(plan.targets[0].label).toBe("the only label");
    });
  });

  describe("mark length", () => {
    it("uses the preferred length when the label is large enough", () => {
      expect(calibrationSheet(geometry()).markLengthMm).toBe(10);
    });

    it("shrinks a mark to stay inside a small label", () => {
      const plan = calibrationSheet(
        geometry({
          label: { widthMm: millimetres(8), heightMm: millimetres(30) },
        }),
      );

      // 60% of the smaller dimension, so the mark cannot spill past its label.
      expect(plan.markLengthMm).toBeCloseTo(4.8, 9);
    });

    it("never shrinks a mark below what can be measured", () => {
      const plan = calibrationSheet(
        geometry({
          label: { widthMm: millimetres(1), heightMm: millimetres(1) },
        }),
      );

      expect(plan.markLengthMm).toBe(2);
    });
  });
});
