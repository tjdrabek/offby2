import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_FIELDS,
  createEmptySheetLayoutInput,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import {
  AXIS_EQUATIONS,
  axisEquationFor,
  deriveMissingDimension,
} from "./deriveDimension";
import { MAX_GRID_COUNT } from "./SheetGeometry";

/**
 * A sheet whose entries satisfy both axis equations exactly, so removing any
 * one of them leaves a single well-determined unknown.
 *
 * Horizontal: 210 = 10 + 3 × 60 + 2 × 5 + 10
 * Vertical:   297 = 9.5 + 7 × 38 + 6 × 2 + 9.5
 */
const CONSISTENT: Record<MeasurementFieldId, string> = {
  sheetWidth: "210",
  sheetHeight: "297",
  labelWidth: "60",
  labelHeight: "38",
  marginTop: "9.5",
  marginRight: "10",
  marginBottom: "9.5",
  marginLeft: "10",
  horizontalGap: "5",
  verticalGap: "2",
};

function sheet(
  overrides: Partial<Record<MeasurementFieldId, string>> = {},
  counts: { rows?: string; columns?: string } = {},
): SheetLayoutSourceInput {
  const input = createEmptySheetLayoutInput("mm");
  const measurements = { ...input.measurements };
  for (const field of MEASUREMENT_FIELDS) {
    measurements[field.id] = {
      unit: "mm",
      text: overrides[field.id] ?? CONSISTENT[field.id],
    };
  }
  return {
    ...input,
    measurements,
    counts: {
      rows: { text: counts.rows ?? "7" },
      columns: { text: counts.columns ?? "3" },
    },
  };
}

/** Derives `field` from an otherwise consistent sheet. */
function derive(
  field: MeasurementFieldId,
  overrides: Partial<Record<MeasurementFieldId, string>> = {},
  counts: { rows?: string; columns?: string } = {},
) {
  return deriveMissingDimension(sheet({ [field]: "", ...overrides }, counts));
}

describe("axisEquationFor", () => {
  it("places every dimensional field on exactly one axis", () => {
    const seen = MEASUREMENT_FIELDS.map(
      (field) => axisEquationFor(field.id).axis,
    );

    expect(seen.filter((axis) => axis === "horizontal")).toHaveLength(5);
    expect(seen.filter((axis) => axis === "vertical")).toHaveLength(5);
    expect(AXIS_EQUATIONS).toHaveLength(2);
  });
});

describe("deriveMissingDimension", () => {
  it("derives a missing margin from the horizontal equation", () => {
    const result = derive("marginLeft");
    if (result.status !== "derived") {
      throw new Error(`Expected a derivation, got ${result.status}.`);
    }

    expect(result.derivation).toMatchObject({
      field: "marginLeft",
      label: "Left margin",
      axis: "horizontal",
      valueMm: 10,
    });
    expect(result.derivation.equation).toBe(
      "Sheet width = Left margin + Columns × Label width + (Columns − 1) × Horizontal gap + Right margin",
    );
    expect(result.derivation.substitution).toBe(
      "210 = 10 + 3 × 60 + 2 × 5 + 10",
    );
  });

  it("names every operand it solved with, including the count", () => {
    const result = derive("labelHeight");
    if (result.status !== "derived") {
      throw new Error("Expected a derivation.");
    }

    expect(result.derivation.valueMm).toBe(38);
    expect(result.derivation.axis).toBe("vertical");
    expect(result.derivation.operands).toEqual([
      { field: "sheetHeight", label: "Sheet height", value: 297 },
      { field: "marginTop", label: "Top margin", value: 9.5 },
      { field: "verticalGap", label: "Vertical gap", value: 2 },
      { field: "marginBottom", label: "Bottom margin", value: 9.5 },
      { field: "rows", label: "Rows", value: 7 },
    ]);
    // The field being derived is never listed as something it was solved from.
    expect(
      result.derivation.operands.some((o) => o.field === "labelHeight"),
    ).toBe(false);
  });

  it.each<[MeasurementFieldId, number]>([
    ["sheetWidth", 210],
    ["labelWidth", 60],
    ["marginRight", 10],
    ["horizontalGap", 5],
    ["sheetHeight", 297],
    ["labelHeight", 38],
    ["marginTop", 9.5],
    ["marginBottom", 9.5],
    ["verticalGap", 2],
    ["marginLeft", 10],
  ])("recovers %s as %s mm when it is the only value missing", (field, mm) => {
    const result = derive(field);
    if (result.status !== "derived") {
      throw new Error(`Expected ${field} to be derived.`);
    }

    expect(result.derivation.valueMm).toBeCloseTo(mm, 9);
  });

  it("does not derive when nothing is missing", () => {
    expect(deriveMissingDimension(sheet())).toEqual({
      status: "not-attempted",
      reason: "nothing-missing",
    });
  });

  it("does not derive when two dimensions are missing", () => {
    expect(derive("marginLeft", { marginRight: "" })).toEqual({
      status: "not-attempted",
      reason: "multiple-missing",
    });
    // Two unknowns on different axes are no more solvable than two on one.
    expect(derive("marginLeft", { marginTop: "" })).toEqual({
      status: "not-attempted",
      reason: "multiple-missing",
    });
  });

  it.each(["", "2.5", "0", `${MAX_GRID_COUNT + 1}`, "1e3"])(
    "does not derive while the column count is %s",
    (columns) => {
      expect(derive("marginLeft", {}, { columns })).toEqual({
        status: "not-attempted",
        reason: "counts-unusable",
      });
    },
  );

  it("does not derive while another value on the axis is unreadable", () => {
    expect(derive("marginLeft", { labelWidth: "21O" })).toEqual({
      status: "not-attempted",
      reason: "operands-unusable",
    });
  });

  it("refuses a gap that a single column removes from the equation", () => {
    const result = derive("horizontalGap", {}, { columns: "1" });
    if (result.status !== "refused") {
      throw new Error(`Expected a refusal, got ${result.status}.`);
    }

    expect(result.code).toBe("derivation-not-unique");
    expect(result.field).toBe("horizontalGap");
    expect(result.message).toMatch(/cannot be derived/);
  });

  it("still derives a label size when there is a single column", () => {
    const result = derive(
      "labelWidth",
      { sheetWidth: "80", marginLeft: "10", marginRight: "10" },
      { columns: "1" },
    );
    if (result.status !== "derived") {
      throw new Error("Expected a single-column label width to be derived.");
    }

    expect(result.derivation.valueMm).toBe(60);
  });

  it("refuses a solution the other values push below zero", () => {
    const result = derive("marginLeft", { labelWidth: "100" });
    if (result.status !== "refused") {
      throw new Error(`Expected a refusal, got ${result.status}.`);
    }

    expect(result.code).toBe("derivation-negative");
    expect(result.message).toMatch(/-110 mm/);
  });

  it("refuses a solution beyond the largest supported measurement", () => {
    const result = derive("sheetWidth", { labelWidth: "999999" });
    if (result.status !== "refused") {
      throw new Error(`Expected a refusal, got ${result.status}.`);
    }

    expect(result.code).toBe("derivation-out-of-range");
  });

  it("treats a result within the documented tolerance of zero as zero", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in binary floating point, so this
    // subtraction lands a hair below zero without the layout being wrong.
    const result = derive(
      "marginLeft",
      {
        sheetWidth: "0.3",
        labelWidth: "0.2",
        marginRight: "0.1",
        horizontalGap: "0",
      },
      { columns: "1" },
    );
    if (result.status !== "derived") {
      throw new Error(`Expected a derivation, got ${result.status}.`);
    }

    expect(result.derivation.valueMm).toBe(0);
    expect(Object.is(result.derivation.valueMm, -0)).toBe(false);
  });

  it("derives a value that reconciles at the largest supported count", () => {
    const result = derive(
      "sheetHeight",
      { labelHeight: "0.5", verticalGap: "0.25" },
      { rows: `${MAX_GRID_COUNT}` },
    );
    if (result.status !== "derived") {
      throw new Error(`Expected a derivation, got ${result.status}.`);
    }

    // 9.5 + 1000 × 0.5 + 999 × 0.25 + 9.5
    expect(result.derivation.valueMm).toBeCloseTo(768.75, 9);
  });

  it("produces a substitution that balances the equation it states", () => {
    for (const field of MEASUREMENT_FIELDS) {
      const result = derive(field.id);
      if (result.status !== "derived") {
        throw new Error(`Expected ${field.id} to be derived.`);
      }
      const [left, right] = result.derivation.substitution.split(" = ");
      const total = right
        .split(" + ")
        .map((term) =>
          term
            .split(" × ")
            .reduce((product, factor) => product * Number(factor), 1),
        )
        .reduce((sum, term) => sum + term, 0);

      expect(total).toBeCloseTo(Number(left), 9);
    }
  });
});
