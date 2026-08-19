import { describe, expect, it } from "vitest";
import {
  MAX_FRACTION_TOKEN_DIGITS,
  MAX_MEASUREMENT_MM,
  parseMeasurement,
  type MeasurementParseErrorCode,
} from "./parseMeasurement.js";
import {
  MEASUREMENT_TOLERANCE_MM,
  MM_PER_INCH,
  measurementsEqual,
} from "./measurementUnits.js";
import type { LengthUnit } from "./SheetLayoutInput.js";
import { composeRefusalMessage } from "./refusalMessage.js";

function parse(text: string, unit: LengthUnit = "mm") {
  return parseMeasurement("sheetWidth", { text, unit });
}

/** The millimetre value, or the code that refused it. */
function valueOf(text: string, unit: LengthUnit = "mm") {
  const result = parse(text, unit);
  if (result.status !== "parsed") {
    throw new Error(`Expected ${text} (${unit}) to parse, got ${result.code}.`);
  }
  return result.valueMm;
}

function codeOf(text: string, unit: LengthUnit = "mm") {
  const result = parse(text, unit);
  return result.status === "invalid" ? result.code : null;
}

describe("parseMeasurement", () => {
  it.each<[string, LengthUnit, number]>([
    ["0", "mm", 0],
    ["63.5", "mm", 63.5],
    ["  210  ", "mm", 210],
    [".5", "mm", 0.5],
    ["+7", "mm", 7],
    ["-3.25", "mm", -3.25],
    ["12.", "mm", 12],
    ["2.54", "cm", 25.4],
    ["0.1", "cm", 1],
    ["1", "in", 25.4],
    ["8.5", "in", 215.9],
  ])("parses %s %s as finite millimetres", (text, unit, expected) => {
    expect(measurementsEqual(valueOf(text, unit), expected)).toBe(true);
  });

  it("converts inches with exactly 25.4 millimetres per inch", () => {
    expect(MM_PER_INCH).toBe(25.4);
    expect(valueOf("1", "in")).toBe(25.4);
    expect(valueOf("2", "in")).toBe(50.8);
  });

  it.each<[string, number]>([
    ["1/2", 0.5],
    ["3/4", 0.75],
    ["8 1/2", 8.5],
    ["11 15/16", 11 + 15 / 16],
    ["-1 1/4", -1.25],
    ["+2 3/8", 2.375],
    ["1 / 2", 0.5],
    ["5/4", 1.25],
  ])(
    "parses the imperial fraction %s without evaluating it",
    (text, inches) => {
      expect(measurementsEqual(valueOf(text, "in"), inches * MM_PER_INCH)).toBe(
        true,
      );
    },
  );

  it("discloses the notation and the source text it came from", () => {
    const fraction = parse("8 1/2", "in");
    expect(fraction).toMatchObject({
      status: "parsed",
      source: { text: "8 1/2", unit: "in", notation: "fraction" },
    });
    expect(parse("  63.5 ", "mm")).toMatchObject({
      source: { text: "63.5", unit: "mm", notation: "decimal" },
    });
  });

  it.each<[string, LengthUnit, MeasurementParseErrorCode]>([
    ["", "mm", "measurement-required"],
    ["   ", "mm", "measurement-required"],
    ["abc", "mm", "measurement-malformed"],
    ["12mm", "mm", "measurement-malformed"],
    ["1,5", "mm", "measurement-malformed"],
    ["1e3", "mm", "measurement-malformed"],
    ["NaN", "mm", "measurement-malformed"],
    ["Infinity", "mm", "measurement-malformed"],
    ["-Infinity", "mm", "measurement-malformed"],
    ["1 + 1", "mm", "measurement-malformed"],
    ["2**3", "mm", "measurement-malformed"],
    ["alert(1)/2", "in", "measurement-malformed"],
    ["1//2", "in", "measurement-malformed"],
    ["1/2/3", "in", "measurement-malformed"],
    ["1/0", "in", "measurement-zero-denominator"],
    ["3 4/0", "in", "measurement-zero-denominator"],
    ["1/2", "mm", "measurement-fraction-requires-inches"],
    ["1/2", "cm", "measurement-fraction-requires-inches"],
  ])("refuses %s (%s) with a structured error", (text, unit, code) => {
    expect(codeOf(text, unit)).toBe(code);
  });

  it("names the field and says how to correct every refusal", () => {
    const result = parseMeasurement("labelHeight", {
      text: "wide",
      unit: "mm",
    });

    expect(result).toMatchObject({
      status: "invalid",
      field: "labelHeight",
      code: "measurement-malformed",
      message: expect.stringContaining("63.5"),
    });
  });

  it("caps each part of a fraction rather than accepting an excessive one", () => {
    const oversized = "1".repeat(MAX_FRACTION_TOKEN_DIGITS + 1);

    expect(codeOf(`1/${oversized}`, "in")).toBe(
      "measurement-fraction-too-large",
    );
    expect(codeOf(`${oversized}/2`, "in")).toBe(
      "measurement-fraction-too-large",
    );
    expect(codeOf(`${oversized} 1/2`, "in")).toBe(
      "measurement-fraction-too-large",
    );
    // A denominator at the cap is still accepted.
    expect(
      codeOf(`1/${"9".repeat(MAX_FRACTION_TOKEN_DIGITS)}`, "in"),
    ).toBeNull();
  });

  it("refuses values that overflow the supported range", () => {
    expect(codeOf(`${MAX_MEASUREMENT_MM + 1}`, "mm")).toBe(
      "measurement-out-of-range",
    );
    expect(codeOf(`-${MAX_MEASUREMENT_MM + 1}`, "mm")).toBe(
      "measurement-out-of-range",
    );
    // Long digit strings reach infinity through Number(); the bound stops them.
    expect(codeOf("9".repeat(400), "mm")).toBe("measurement-out-of-range");
    expect(codeOf(`${MAX_MEASUREMENT_MM}`, "mm")).toBeNull();
    // The bound applies to the normalized value, not the entered one.
    expect(codeOf(`${MAX_MEASUREMENT_MM / 10}`, "cm")).toBeNull();
    expect(codeOf(`${MAX_MEASUREMENT_MM}`, "cm")).toBe(
      "measurement-out-of-range",
    );
  });

  it.each<[string, LengthUnit, string, LengthUnit]>([
    ["25.4", "mm", "1", "in"],
    ["2.54", "cm", "1", "in"],
    ["25.4", "mm", "2.54", "cm"],
    ["215.9", "mm", "8 1/2", "in"],
    ["19.05", "mm", "3/4", "in"],
    ["10", "cm", "100", "mm"],
  ])(
    "normalizes %s %s and %s %s to the same millimetres",
    (leftText, leftUnit, rightText, rightUnit) => {
      const left = valueOf(leftText, leftUnit);
      const right = valueOf(rightText, rightUnit);

      expect(measurementsEqual(left, right)).toBe(true);
      expect(Math.abs(left - right)).toBeLessThanOrEqual(
        MEASUREMENT_TOLERANCE_MM,
      );
    },
  );

  it("never mutates the input it was given", () => {
    const input = { text: "  8 1/2  ", unit: "in" as const };
    const snapshot = { ...input };

    parseMeasurement("sheetWidth", input);

    expect(input).toEqual(snapshot);
  });

  it.each<[string, LengthUnit]>([
    ["", "mm"],
    ["abc", "mm"],
    ["1/2", "mm"],
    ["1/0", "in"],
    ["1".repeat(MAX_FRACTION_TOKEN_DIGITS + 1) + "/2", "in"],
    [`${MAX_MEASUREMENT_MM + 1}`, "mm"],
  ])(
    "carries an explanation and remedies whose composition is the message for %s (%s)",
    (text, unit) => {
      const result = parseMeasurement("sheetWidth", { text, unit });
      if (result.status !== "invalid") {
        throw new Error("Expected a refusal.");
      }

      expect(
        composeRefusalMessage({
          explanation: result.explanation,
          remedies: result.remedies,
        }),
      ).toBe(result.message);
    },
  );
});
