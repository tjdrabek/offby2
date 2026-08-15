import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_FIELDS,
  createEmptySheetLayoutInput,
  withCornerRadiusState,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";
import { resolveSheetLayout } from "./resolveSheetLayout";

/** Horizontal: 210 = 10 + 3 × 60 + 2 × 5 + 10. Vertical: 297 = 9.5 + 7 × 38 + 6 × 2 + 9.5. */
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

describe("resolveSheetLayout", () => {
  it("resolves a fully entered layout without deriving anything", () => {
    const result = resolveSheetLayout(sheet());
    if (result.status !== "resolved") {
      throw new Error("Expected the complete sheet to resolve.");
    }

    expect(result.layout.derivation).toBeNull();
    expect(result.layout.counts).toEqual({ rows: 7, columns: 3 });
    expect(result.layout.measurements.marginLeft).toEqual({
      status: "parsed",
      valueMm: 10,
      source: { text: "10", unit: "mm", notation: "decimal" },
    });
  });

  it("fills the one missing dimension and marks it as derived", () => {
    const result = resolveSheetLayout(sheet({ marginLeft: "" }));
    if (result.status !== "resolved") {
      throw new Error("Expected the single unknown to be derived.");
    }

    const marginLeft = result.layout.measurements.marginLeft;
    expect(marginLeft.status).toBe("derived");
    expect(marginLeft.valueMm).toBe(10);
    expect(result.layout.derivation?.field).toBe("marginLeft");
    // Every other value keeps its source text, so the two are told apart.
    expect(result.layout.measurements.marginRight.status).toBe("parsed");
  });

  it("keeps the entered text untouched when a value is derived", () => {
    const input = sheet({ marginLeft: "   " });
    resolveSheetLayout(input);

    expect(input.measurements.marginLeft.text).toBe("   ");
  });

  it("derives across units without changing the source disclosure", () => {
    const input = sheet({ marginLeft: "" });
    const inches: SheetLayoutSourceInput = {
      ...input,
      measurements: {
        ...input.measurements,
        // 60 mm expressed in inches, leaving the same margin to be derived.
        labelWidth: { text: "2.3622047244", unit: "in" },
      },
    };
    const result = resolveSheetLayout(inches);
    if (result.status !== "resolved") {
      throw new Error("Expected a mixed-unit sheet to resolve.");
    }

    expect(result.layout.measurements.marginLeft.valueMm).toBeCloseTo(10, 6);
    expect(result.layout.derivation?.axis).toBe("horizontal");
  });

  it("reports a refused derivation against the field it belongs to", () => {
    const result = resolveSheetLayout(
      sheet({ horizontalGap: "" }, { columns: "1" }),
    );
    if (result.status !== "unresolved") {
      throw new Error("Expected the un-derivable gap to stay unresolved.");
    }

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      field: "horizontalGap",
      code: "derivation-not-unique",
    });
    // The bare "Enter a value." is replaced by the reason it cannot be supplied.
    expect(result.issues[0].message).not.toBe("Enter a value.");
    expect(result.derivation.status).toBe("refused");
  });

  it("does not derive when two dimensions are missing", () => {
    const result = resolveSheetLayout(
      sheet({ marginLeft: "", marginRight: "" }),
    );
    if (result.status !== "unresolved") {
      throw new Error("Expected two unknowns to stay unresolved.");
    }

    expect(result.issues.map((issue) => issue.field)).toEqual([
      "marginRight",
      "marginLeft",
    ]);
    expect(result.issues.every((issue) => issue.code === "required")).toBe(
      true,
    );
    expect(result.derivation).toEqual({
      status: "not-attempted",
      reason: "multiple-missing",
    });
  });

  it("does not derive while some other entry is still wrong", () => {
    for (const broken of [
      sheet({ marginLeft: "", labelWidth: "21O" }),
      sheet({ marginLeft: "" }, { rows: "2.5" }),
    ]) {
      const result = resolveSheetLayout(broken);

      expect(result.status).toBe("unresolved");
    }
  });

  it("does not derive while a claimed corner radius has no measurement", () => {
    const result = resolveSheetLayout(
      withCornerRadiusState(sheet({ marginLeft: "" }), "known", "mm"),
    );
    if (result.status !== "unresolved") {
      throw new Error("Expected the missing radius to keep it unresolved.");
    }

    expect(result.issues.map((issue) => issue.field)).toEqual([
      "marginLeft",
      "cornerRadius",
    ]);
  });

  it("refuses rather than derives a negative value", () => {
    const result = resolveSheetLayout(
      sheet({ marginLeft: "", labelWidth: "100" }),
    );
    if (result.status !== "unresolved") {
      throw new Error("Expected a negative solution to be refused.");
    }

    expect(result.issues[0]).toMatchObject({
      field: "marginLeft",
      code: "derivation-negative",
    });
  });
});
