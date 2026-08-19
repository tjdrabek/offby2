import { describe, expect, it } from "vitest";
import {
  MAX_GRID_COUNT,
  cornerRadiusMm,
  isGridCount,
  millimetres,
  type CornerRadiusDisclosure,
} from "./SheetGeometry.js";

describe("millimetres", () => {
  it("brands finite values, including zero and negatives", () => {
    expect(millimetres(0)).toBe(0);
    expect(millimetres(210)).toBe(210);
    // Refusing negative geometry is a domain rule, not a property of the unit.
    expect(millimetres(-3.5)).toBe(-3.5);
  });

  it("refuses every non-finite value", () => {
    expect(() => millimetres(Number.NaN)).toThrow(/finite millimetre/);
    expect(() => millimetres(Number.POSITIVE_INFINITY)).toThrow(
      /finite millimetre/,
    );
    expect(() => millimetres(Number.NEGATIVE_INFINITY)).toThrow(
      /finite millimetre/,
    );
  });

  it("refuses values that are not numbers at all", () => {
    expect(() => millimetres("210" as unknown as number)).toThrow(
      /finite millimetre/,
    );
  });
});

describe("cornerRadiusMm", () => {
  it("reports zero corners as a measurable zero radius", () => {
    expect(cornerRadiusMm({ state: "zero" })).toBe(0);
  });

  it("reports known and estimated radii", () => {
    const known: CornerRadiusDisclosure = {
      state: "known",
      radiusMm: millimetres(2),
    };
    const estimated: CornerRadiusDisclosure = {
      state: "estimated",
      radiusMm: millimetres(1.5),
    };

    expect(cornerRadiusMm(known)).toBe(2);
    expect(cornerRadiusMm(estimated)).toBe(1.5);
  });

  it("makes no radius claim when the corners were never measured", () => {
    // Unknown must never collapse into zero: one is a measurement, the other
    // is the absence of one.
    expect(cornerRadiusMm({ state: "unknown" })).toBeNull();
    expect(cornerRadiusMm({ state: "unknown" })).not.toBe(
      cornerRadiusMm({ state: "zero" }),
    );
  });
});

describe("isGridCount", () => {
  it("accepts bounded positive integers", () => {
    expect(isGridCount(1)).toBe(true);
    expect(isGridCount(12)).toBe(true);
    expect(isGridCount(MAX_GRID_COUNT)).toBe(true);
  });

  it("rejects zero, negatives, fractions, and out-of-range counts", () => {
    expect(isGridCount(0)).toBe(false);
    expect(isGridCount(-1)).toBe(false);
    expect(isGridCount(2.5)).toBe(false);
    expect(isGridCount(MAX_GRID_COUNT + 1)).toBe(false);
    expect(isGridCount(Number.NaN)).toBe(false);
    expect(isGridCount(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
