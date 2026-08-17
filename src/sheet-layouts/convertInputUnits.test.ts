import { describe, expect, it } from "vitest";

import { convertInputUnits } from "./convertInputUnits";
import {
  losslessMeasurementText,
  measurementFrom,
  measurementsEqual,
  toMillimetres,
} from "./measurementUnits";
import { createEmptySheetLayoutInput } from "./SheetLayoutInput";

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
