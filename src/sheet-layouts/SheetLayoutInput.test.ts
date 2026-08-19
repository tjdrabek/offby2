import { describe, expect, it } from "vitest";
import {
  COUNT_FIELDS,
  MEASUREMENT_FIELDS,
  cornerRadiusValue,
  createEmptySheetLayoutInput,
  lengthUnitSuffix,
  withCornerRadiusState,
  withMeasurementUnit,
} from "./SheetLayoutInput.js";

describe("createEmptySheetLayoutInput", () => {
  it("carries an explicit unit on every dimensional field", () => {
    const input = createEmptySheetLayoutInput("in");

    for (const field of MEASUREMENT_FIELDS) {
      expect(input.measurements[field.id]).toEqual({ text: "", unit: "in" });
    }
    for (const field of COUNT_FIELDS) {
      expect(input.counts[field.id]).toEqual({ text: "" });
    }
  });

  it("covers sheet, label, four independent margins, and both gaps", () => {
    expect(MEASUREMENT_FIELDS.map((field) => field.id)).toEqual([
      "sheetWidth",
      "sheetHeight",
      "labelWidth",
      "labelHeight",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "horizontalGap",
      "verticalGap",
    ]);
  });

  it("starts with a stated corner-radius disclosure rather than an absent one", () => {
    expect(createEmptySheetLayoutInput().cornerRadius).toEqual({
      state: "zero",
    });
  });
});

describe("withMeasurementUnit", () => {
  it("re-expresses the unit without touching the source text", () => {
    const input = createEmptySheetLayoutInput("mm");
    const typed = {
      ...input,
      measurements: {
        ...input.measurements,
        sheetWidth: { text: "8 1/2", unit: "mm" as const },
      },
    };

    const converted = withMeasurementUnit(typed, "in");

    expect(converted.measurements.sheetWidth).toEqual({
      text: "8 1/2",
      unit: "in",
    });
  });

  it("moves an entered corner radius to the new unit as well", () => {
    const base = withCornerRadiusState(
      createEmptySheetLayoutInput("mm"),
      "known",
      "mm",
    );
    const withRadius = {
      ...base,
      cornerRadius: {
        state: "known" as const,
        value: { text: "2", unit: "mm" as const },
      },
    };

    expect(
      cornerRadiusValue(withMeasurementUnit(withRadius, "cm").cornerRadius),
    ).toEqual({
      text: "2",
      unit: "cm",
    });
  });

  it("leaves the states that carry no radius alone", () => {
    const unknown = withCornerRadiusState(
      createEmptySheetLayoutInput(),
      "unknown",
      "mm",
    );

    expect(withMeasurementUnit(unknown, "in").cornerRadius).toEqual({
      state: "unknown",
    });
  });
});

describe("withCornerRadiusState", () => {
  it("carries an entered radius between the two states that use one", () => {
    const known = {
      ...createEmptySheetLayoutInput(),
      cornerRadius: {
        state: "known" as const,
        value: { text: "3", unit: "mm" as const },
      },
    };

    const estimated = withCornerRadiusState(known, "estimated", "mm");

    expect(estimated.cornerRadius).toEqual({
      state: "estimated",
      value: { text: "3", unit: "mm" },
    });
  });

  it("drops the radius entirely for zero and unknown", () => {
    const known = {
      ...createEmptySheetLayoutInput(),
      cornerRadius: {
        state: "known" as const,
        value: { text: "3", unit: "mm" as const },
      },
    };

    expect(withCornerRadiusState(known, "zero", "mm").cornerRadius).toEqual({
      state: "zero",
    });
    expect(withCornerRadiusState(known, "unknown", "mm").cornerRadius).toEqual({
      state: "unknown",
    });
  });
});

describe("lengthUnitSuffix", () => {
  it("names each supported unit in text", () => {
    expect(lengthUnitSuffix("mm")).toBe("mm");
    expect(lengthUnitSuffix("cm")).toBe("cm");
    expect(lengthUnitSuffix("in")).toBe("in");
  });
});
