import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_TOLERANCE_MM,
  MM_PER_CENTIMETRE,
  MM_PER_INCH,
  formatMeasurement,
  formatMillimetres,
  fromMillimetres,
  measurementFrom,
  measurementsEqual,
  millimetresPerUnit,
  toMillimetres,
} from "./measurementUnits.js";
import { millimetres } from "./SheetGeometry.js";
import { parseMeasurement } from "./parseMeasurement.js";

describe("unit conversion", () => {
  it("uses the exact documented constants", () => {
    expect(MM_PER_INCH).toBe(25.4);
    expect(MM_PER_CENTIMETRE).toBe(10);
    expect(millimetresPerUnit("mm")).toBe(1);
    expect(millimetresPerUnit("cm")).toBe(10);
    expect(millimetresPerUnit("in")).toBe(25.4);
  });

  it("round-trips a value through a display unit within precision", () => {
    const value = measurementFrom(8.5, "in");

    expect(measurementsEqual(fromMillimetres(value, "in"), 8.5)).toBe(true);
    expect(toMillimetres(fromMillimetres(value, "cm"), "cm")).toBeCloseTo(
      value,
      9,
    );
  });

  it("compares within the documented tolerance and no further", () => {
    expect(measurementsEqual(0, MEASUREMENT_TOLERANCE_MM)).toBe(true);
    expect(measurementsEqual(25.4, 25.4 + 1e-6)).toBe(false);
    // Float dust from an exact conversion stays well inside the tolerance.
    expect(measurementsEqual(215.9, 8.5 * MM_PER_INCH)).toBe(true);
  });
});

describe("formatMillimetres", () => {
  it.each<[number, "mm" | "cm" | "in", string]>([
    [25.4, "mm", "25.4"],
    [25.4, "cm", "2.54"],
    [25.4, "in", "1"],
    [215.9, "in", "8.5"],
    [0, "mm", "0"],
    [210, "mm", "210"],
    [19.049999999999997, "in", "0.75"],
  ])("renders %s mm in %s as %s", (value, unit, expected) => {
    expect(formatMillimetres(millimetres(value), unit)).toBe(expected);
  });

  it("never renders a negative zero", () => {
    expect(formatMillimetres(millimetres(-1e-12), "mm")).toBe("0");
  });

  it("appends the unit when the value is shown on its own", () => {
    expect(formatMeasurement(millimetres(63.5), "mm")).toBe("63.5 mm");
    expect(formatMeasurement(millimetres(25.4), "in")).toBe("1 in");
  });

  it("does not feed display rounding back into the normalized value", () => {
    const parsed = parseMeasurement("labelWidth", { text: "1/3", unit: "in" });
    if (parsed.status !== "parsed") {
      throw new Error("Expected 1/3 in to parse.");
    }
    const shown = formatMillimetres(parsed.valueMm, "mm");

    // The display string is rounded; the value it came from is not.
    expect(shown).toBe("8.5");
    expect(parsed.valueMm).toBe((1 / 3) * MM_PER_INCH);
    expect(parsed.valueMm).not.toBe(Number(shown));
    // Re-formatting is idempotent, so nothing accumulates rounding either.
    expect(formatMillimetres(parsed.valueMm, "mm")).toBe(shown);
  });
});
