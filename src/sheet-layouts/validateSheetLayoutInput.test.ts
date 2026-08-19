import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_FIELDS,
  createEmptySheetLayoutInput,
  withCornerRadiusState,
  withMeasurementUnit,
  type LengthUnit,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput.js";
import { measurementsEqual } from "./measurementUnits.js";
import {
  issuesByField,
  validateSheetLayoutInput,
} from "./validateSheetLayoutInput.js";
import { MAX_GRID_COUNT } from "./SheetGeometry.js";
import { composeRefusalMessage } from "./refusalMessage.js";

/** A complete, representable entry in millimetres with square corners. */
function completeInput(): SheetLayoutSourceInput {
  const input = createEmptySheetLayoutInput("mm");
  const measurements = { ...input.measurements };
  const values: Record<string, string> = {
    sheetWidth: "210",
    sheetHeight: "297",
    labelWidth: "63.5",
    labelHeight: "38.1",
    marginTop: "10",
    marginRight: "7",
    marginBottom: "10",
    marginLeft: "7",
    horizontalGap: "2.5",
    verticalGap: "0",
  };
  for (const field of MEASUREMENT_FIELDS) {
    measurements[field.id] = {
      ...measurements[field.id],
      text: values[field.id],
    };
  }
  return {
    ...input,
    measurements,
    counts: { rows: { text: "7" }, columns: { text: "3" } },
  };
}

function countIssues(input: SheetLayoutSourceInput) {
  const result = validateSheetLayoutInput(input);
  return result.status === "unrepresentable" ? result.issues : [];
}

describe("validateSheetLayoutInput", () => {
  it("accepts a complete uniform grid and returns its validated counts", () => {
    const result = validateSheetLayoutInput(completeInput());

    expect(result).toMatchObject({
      status: "representable",
      counts: { rows: 7, columns: 3 },
      cornerRadius: null,
    });
  });

  it("normalizes every measurement into millimetres with its source", () => {
    const result = validateSheetLayoutInput(completeInput());
    if (result.status !== "representable") {
      throw new Error("Expected the complete input to be representable.");
    }

    expect(result.measurements.sheetWidth).toEqual({
      status: "parsed",
      valueMm: 210,
      source: { text: "210", unit: "mm", notation: "decimal" },
    });
    expect(result.measurements.labelWidth.valueMm).toBe(63.5);
    expect(result.measurements.verticalGap.valueMm).toBe(0);
  });

  it("normalizes the same sheet identically however it was entered", () => {
    const metric = validateSheetLayoutInput(completeInput());
    const input = completeInput();
    const imperial = validateSheetLayoutInput({
      ...input,
      measurements: {
        ...input.measurements,
        // 2 1/2 in is exactly the 63.5 mm the metric entry states.
        labelWidth: { text: "2 1/2", unit: "in" },
      },
    });
    if (
      metric.status !== "representable" ||
      imperial.status !== "representable"
    ) {
      throw new Error("Expected both entries to be representable.");
    }

    expect(
      measurementsEqual(
        imperial.measurements.labelWidth.valueMm,
        metric.measurements.labelWidth.valueMm,
      ),
    ).toBe(true);
    // The equal value does not erase how it was written.
    expect(imperial.measurements.labelWidth.source).toEqual({
      text: "2 1/2",
      unit: "in",
      notation: "fraction",
    });
  });

  it("normalizes a claimed corner radius alongside the dimensions", () => {
    const base = withCornerRadiusState(completeInput(), "known", "in");
    const result = validateSheetLayoutInput({
      ...base,
      cornerRadius: { state: "known", value: { text: "1/8", unit: "in" } },
    });
    if (result.status !== "representable") {
      throw new Error("Expected the radius to normalize.");
    }

    expect(result.cornerRadius?.valueMm).toBeCloseTo(3.175, 9);
  });

  it.each<[string, LengthUnit, string]>([
    ["abc", "mm", "measurement-malformed"],
    ["1e3", "mm", "measurement-malformed"],
    ["12mm", "mm", "measurement-malformed"],
    ["1/0", "in", "measurement-zero-denominator"],
    ["1/2", "mm", "measurement-fraction-requires-inches"],
    ["99999999", "mm", "measurement-out-of-range"],
  ])("refuses %s (%s) as a sheet width", (text, unit, code) => {
    const input = completeInput();
    const issues = countIssues({
      ...input,
      measurements: {
        ...input.measurements,
        sheetWidth: { text, unit },
      },
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "sheetWidth", code });
    expect(issues[0].message).not.toBe("");
  });

  it("requires every dimension, both counts, and nothing else", () => {
    const issues = countIssues(createEmptySheetLayoutInput());

    expect(issues).toHaveLength(MEASUREMENT_FIELDS.length + 2);
    expect(issues.every((issue) => issue.code === "required")).toBe(true);
    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
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
        "rows",
        "columns",
      ]),
    );
  });

  it("treats whitespace-only text as missing without rewriting it", () => {
    const input = completeInput();
    const withBlank: SheetLayoutSourceInput = {
      ...input,
      measurements: {
        ...input.measurements,
        marginLeft: { ...input.measurements.marginLeft, text: "   " },
      },
    };

    expect(countIssues(withBlank)).toMatchObject([
      { field: "marginLeft", code: "required", message: "Enter a value." },
    ]);
    // The source text survives validation untouched.
    expect(withBlank.measurements.marginLeft.text).toBe("   ");
  });

  it("accepts zero-length gaps and margins as entered values", () => {
    const input = completeInput();
    const result = validateSheetLayoutInput({
      ...input,
      measurements: {
        ...input.measurements,
        marginTop: { ...input.measurements.marginTop, text: "0" },
      },
    });

    expect(result.status).toBe("representable");
  });

  it.each([
    ["2.5", "count-not-an-integer"],
    ["-3", "count-not-an-integer"],
    ["1e3", "count-not-an-integer"],
    ["3 rows", "count-not-an-integer"],
    ["+3", "count-not-an-integer"],
    ["0", "count-out-of-range"],
    [`${MAX_GRID_COUNT + 1}`, "count-out-of-range"],
  ])("refuses %s as a row count", (text, code) => {
    const input = completeInput();
    const issues = countIssues({
      ...input,
      counts: { ...input.counts, rows: { text } },
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "rows", code });
  });

  it("accepts counts at both ends of the supported range", () => {
    const input = completeInput();

    expect(
      validateSheetLayoutInput({
        ...input,
        counts: { rows: { text: "1" }, columns: { text: `${MAX_GRID_COUNT}` } },
      }).status,
    ).toBe("representable");
  });

  it("requires a radius value for the known and estimated states", () => {
    for (const state of ["known", "estimated"] as const) {
      const input = withCornerRadiusState(completeInput(), state, "mm");

      expect(countIssues(input)).toMatchObject([
        {
          field: "cornerRadius",
          code: "required",
          message: "Enter a value.",
        },
      ]);
    }
  });

  it("requires no radius value for the zero and unknown states", () => {
    for (const state of ["zero", "unknown"] as const) {
      const input = withCornerRadiusState(completeInput(), state, "mm");

      expect(validateSheetLayoutInput(input).status).toBe("representable");
    }
  });

  it("accepts a radius once the value is supplied", () => {
    const base = withCornerRadiusState(completeInput(), "estimated", "mm");
    const input: SheetLayoutSourceInput = {
      ...base,
      cornerRadius: { state: "estimated", value: { text: "2", unit: "mm" } },
    };

    expect(validateSheetLayoutInput(input).status).toBe("representable");
  });

  it("validates the same way whatever unit the values were entered in", () => {
    const inches = withMeasurementUnit(completeInput(), "in");

    expect(validateSheetLayoutInput(inches).status).toBe("representable");
    expect(inches.measurements.sheetWidth).toEqual({
      text: "210",
      unit: "in",
    });
  });
});

describe("issue parts", () => {
  it("composes the message from the explanation and remedies on every issue", () => {
    const empty = countIssues(createEmptySheetLayoutInput());
    const outOfRange = countIssues({
      ...completeInput(),
      counts: { rows: { text: "1" }, columns: { text: `${MAX_GRID_COUNT + 1}` } },
    });

    for (const found of [...empty, ...outOfRange]) {
      expect(
        composeRefusalMessage({
          explanation: found.explanation,
          remedies: found.remedies,
        }),
      ).toBe(found.message);
    }
  });
});

describe("issuesByField", () => {
  it("indexes issues so each control can show its own", () => {
    const byField = issuesByField(countIssues(createEmptySheetLayoutInput()));

    expect(byField.get("sheetWidth")?.code).toBe("required");
    expect(byField.get("rows")?.code).toBe("required");
    expect(byField.has("cornerRadius")).toBe(false);
  });
});
