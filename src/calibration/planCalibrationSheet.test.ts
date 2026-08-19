import { describe, expect, it } from "vitest";
import { millimetres, type SheetGeometry } from "../sheet-layouts/SheetGeometry.js";
import { planCalibrationSheet } from "./planCalibrationSheet.js";

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

describe("planCalibrationSheet", () => {
  it("marks the four corners of the grid", () => {
    const plan = planCalibrationSheet(geometry());

    expect(plan.targets.map((target) => [target.row, target.column])).toEqual([
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 2],
    ]);
  });

  it("places each mark at the centre of its label", () => {
    const plan = planCalibrationSheet(geometry());
    const [topLeft] = plan.targets;

    // Label starts at the left/top margin and is 20 x 30.
    expect(topLeft.intendedXMm).toBe(20);
    expect(topLeft.intendedYMm).toBe(20);
  });

  it("carries the sheet extent for a renderer", () => {
    expect(planCalibrationSheet(geometry()).sheet).toEqual({
      widthMm: 100,
      heightMm: 80,
    });
  });

  it("gives every mark a distinct id", () => {
    const ids = planCalibrationSheet(geometry()).targets.map((one) => one.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names each mark by where it sits", () => {
    const plan = planCalibrationSheet(geometry());

    expect(plan.targets.map((one) => one.label)).toEqual([
      "top left label",
      "top right label",
      "bottom left label",
      "bottom right label",
    ]);
  });

  describe("degenerate grids", () => {
    it("marks two labels on a single row", () => {
      const plan = planCalibrationSheet(
        geometry({ grid: { rows: 1, columns: 3 } }),
      );

      expect(plan.targets).toHaveLength(2);
      expect(plan.targets.map((one) => one.label)).toEqual([
        "left label",
        "right label",
      ]);
    });

    it("marks two labels on a single column", () => {
      const plan = planCalibrationSheet(
        geometry({ grid: { rows: 2, columns: 1 } }),
      );

      expect(plan.targets).toHaveLength(2);
      expect(plan.targets.map((one) => one.label)).toEqual([
        "top label",
        "bottom label",
      ]);
    });

    it("marks the only label on a one-label sheet", () => {
      const plan = planCalibrationSheet(
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
      expect(planCalibrationSheet(geometry()).markLengthMm).toBe(10);
    });

    it("shrinks a mark to stay inside a small label", () => {
      const plan = planCalibrationSheet(
        geometry({
          label: { widthMm: millimetres(8), heightMm: millimetres(30) },
        }),
      );

      // 60% of the smaller dimension, so the mark cannot spill past its label.
      expect(plan.markLengthMm).toBeCloseTo(4.8, 9);
    });

    it("never shrinks a mark below what can be measured", () => {
      const plan = planCalibrationSheet(
        geometry({
          label: { widthMm: millimetres(1), heightMm: millimetres(1) },
        }),
      );

      expect(plan.markLengthMm).toBe(2);
    });
  });

  it("states its placement, defaulting to corner-label-centre", () => {
    expect(planCalibrationSheet(geometry()).placement).toBe("corner-label-centre");
    expect(
      planCalibrationSheet(geometry(), "corner-label-centre").placement,
    ).toBe("corner-label-centre");
  });

  it("reproduces today's plan exactly when the placement is omitted", () => {
    // The regression pin for every existing caller: adding the parameter
    // must not move a single mark for a caller that never asked for one.
    const withDefault = planCalibrationSheet(geometry());
    const withoutPlacement = planCalibrationSheet(geometry(), "corner-label-centre");

    expect(withDefault).toEqual(withoutPlacement);
  });
});

describe("planCalibrationSheet — sheet-corner placement", () => {
  function sheet(widthMm: number, heightMm: number): SheetGeometry {
    return geometry({
      sheet: { widthMm: millimetres(widthMm), heightMm: millimetres(heightMm) },
    });
  }

  it("marks all four sheet corners, independent of the grid", () => {
    const plan = planCalibrationSheet(sheet(210, 297), "sheet-corner");

    expect(plan.placement).toBe("sheet-corner");
    expect(plan.targets).toHaveLength(4);
    expect(plan.targets.map((target) => target.row)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("insets every mark by one shared, round distance from the two edges it is measured from", () => {
    const plan = planCalibrationSheet(sheet(210, 297), "sheet-corner");
    const [topLeft, topRight, bottomLeft, bottomRight] = plan.targets;

    expect(topLeft.intendedXMm).toBe(30);
    expect(topLeft.intendedYMm).toBe(30);
    expect(topRight.intendedXMm).toBe(210 - 30);
    expect(topRight.intendedYMm).toBe(30);
    expect(bottomLeft.intendedXMm).toBe(30);
    expect(bottomLeft.intendedYMm).toBe(297 - 30);
    expect(bottomRight.intendedXMm).toBe(210 - 30);
    expect(bottomRight.intendedYMm).toBe(297 - 30);
  });

  it("shrinks the round inset to keep the marks a minimum distance apart", () => {
    // 30 mm needs 100 mm of the shorter axis (2 × 30 + 40 minimum separation);
    // a sheet just under that drops to the next preferred inset, 25 mm.
    const plan = planCalibrationSheet(sheet(99, 200), "sheet-corner");

    expect(plan.targets[0].intendedXMm).toBe(25);
  });

  it("falls back to a quarter of the shorter axis on a sheet too small for any preferred inset", () => {
    // Smallest preferred inset (10 mm) needs 60 mm of the shorter axis; a 40 mm
    // sheet falls back to floor(40 / 4) = 10.
    const plan = planCalibrationSheet(sheet(40, 200), "sheet-corner");

    expect(plan.targets[0].intendedXMm).toBe(10);
  });

  it("never floors the fallback inset below what can be measured", () => {
    const plan = planCalibrationSheet(sheet(4, 200), "sheet-corner");

    expect(plan.targets[0].intendedXMm).toBe(2);
  });

  it("bounds the mark's arm length by its own inset from the sheet edge", () => {
    const generous = planCalibrationSheet(sheet(210, 297), "sheet-corner");
    expect(generous.markLengthMm).toBe(10);

    const tight = planCalibrationSheet(sheet(4, 200), "sheet-corner");
    expect(tight.markLengthMm).toBe(2);
  });
});
