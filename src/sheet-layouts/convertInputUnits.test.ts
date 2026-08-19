import { describe, expect, it } from "vitest";

import { convertInputUnits } from "./convertInputUnits.js";
import {
  losslessMeasurementText,
  measurementFrom,
  measurementsEqual,
  toMillimetres,
} from "./measurementUnits.js";
import { createEmptySheetLayoutInput } from "./SheetLayoutInput.js";

describe("losslessMeasurementText", () => {
  it("prefers the shortest text that still means the same measurement", () => {
    // 4.7625 mm is exactly 0.1875 in; four display digits would round it.
    expect(losslessMeasurementText(measurementFrom(0.1875, "in"), "in")).toBe(
      "0.1875",
    );
    expect(losslessMeasurementText(measurementFrom(0.5, "cm"), "cm")).toBe(
      "0.5",
    );
  });

  it("extends past display precision rather than corrupting the value", () => {
    // A4 width has no four-digit decimal in inches: 210 / 25.4 = 8.2677165354…
    const text = losslessMeasurementText(measurementFrom(210, "mm"), "in");
    expect(text.length).toBeGreaterThan("8.2677".length);
    // Equal within the package's documented tolerance — the same contract
    // every downstream geometry comparison is judged against.
    expect(measurementsEqual(toMillimetres(Number(text), "in"), 210)).toBe(
      true,
    );
  });
});

describe("convertInputUnits", () => {
  it("rounds converted entries to what a person would type", () => {
    const input = {
      ...createEmptySheetLayoutInput("mm"),
      measurements: {
        ...createEmptySheetLayoutInput("mm").measurements,
        // 12 mm has no finite decimal in inches; the entry must not carry
        // ten digits of the conversion's tail.
        marginTop: { text: "12", unit: "mm" as const },
        sheetWidth: { text: "215.9", unit: "mm" as const },
      },
    };

    const converted = convertInputUnits(input, "in");

    expect(converted.measurements.marginTop.text).toBe("0.47");
    // An exact conversion still comes out exact.
    expect(converted.measurements.sheetWidth.text).toBe("8.5");
  });

  it("converts readable values and re-labels the rest", () => {
    const input = {
      ...createEmptySheetLayoutInput("mm"),
      measurements: {
        ...createEmptySheetLayoutInput("mm").measurements,
        sheetWidth: { text: "210", unit: "mm" as const },
        sheetHeight: { text: "not a number", unit: "mm" as const },
      },
    };

    const converted = convertInputUnits(input, "cm");

    expect(converted.measurements.sheetWidth).toEqual({
      text: "21",
      unit: "cm",
    });
    // Unreadable text survives so the operator can keep correcting it.
    expect(converted.measurements.sheetHeight).toEqual({
      text: "not a number",
      unit: "cm",
    });
  });

  it("converts an entered corner radius without changing its state", () => {
    const input = {
      ...createEmptySheetLayoutInput("mm"),
      cornerRadius: {
        state: "estimated" as const,
        value: { text: "2.5", unit: "mm" as const },
      },
    };

    const converted = convertInputUnits(input, "cm");

    expect(converted.cornerRadius).toEqual({
      state: "estimated",
      value: { text: "0.25", unit: "cm" },
    });
  });
});
