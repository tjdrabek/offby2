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

/** The consistent sheet with a radius state that carries its own measurement. */
function withRadius(
  state: "known" | "estimated",
  text: string,
): SheetLayoutSourceInput {
  return {
    ...withCornerRadiusState(sheet(), state, "mm"),
    cornerRadius: { state, value: { text, unit: "mm" } },
  };
}

describe("resolveSheetLayout", () => {
  it("resolves a fully entered layout without deriving anything", () => {
    const result = resolveSheetLayout(sheet());
    if (result.status !== "resolved") {
      throw new Error("Expected the complete sheet to resolve.");
    }

    expect(result.layout.derivations).toEqual([]);
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
    expect(result.layout.derivations.map((one) => one.field)).toEqual([
      "marginLeft",
    ]);
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
    expect(result.layout.derivations[0].axis).toBe("horizontal");
  });

  it("derives a blank single-column gap as 0", () => {
    // 210 = 10 + 1 x 190 + 0 x gap + 10: one column has no gap, and leaving
    // the field blank resolves to the 0 that describes that.
    const result = resolveSheetLayout(
      sheet({ horizontalGap: "", labelWidth: "190" }, { columns: "1" }),
    );
    if (result.status !== "resolved") {
      throw new Error("Expected the single-column gap to derive as 0.");
    }

    expect(result.layout.measurements.horizontalGap.valueMm).toBe(0);
  });

  it("reports a refused derivation against the field it belongs to", () => {
    const result = resolveSheetLayout(
      sheet({ horizontalGap: "" }, { columns: "1" }),
    );
    if (result.status !== "unresolved") {
      throw new Error("Expected the irreconcilable axis to stay unresolved.");
    }

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      field: "horizontalGap",
      code: "derivation-unreconciled",
    });
    // The bare "Enter a value." is replaced by the reason it cannot be supplied.
    expect(result.issues[0].message).not.toBe("Enter a value.");
    expect(result.derivation.horizontal.status).toBe("refused");
    // The vertical axis had nothing missing and says so for itself.
    expect(result.derivation.vertical).toEqual({
      status: "not-attempted",
      reason: "nothing-missing",
    });
  });

  it("derives one dimension on each axis at once", () => {
    const result = resolveSheetLayout(
      sheet({ labelWidth: "", labelHeight: "" }),
    );
    if (result.status !== "resolved") {
      throw new Error("Expected one unknown per axis to be derivable.");
    }

    expect(result.layout.derivations.map((one) => one.field)).toEqual([
      "labelWidth",
      "labelHeight",
    ]);
    expect(result.layout.derivations.map((one) => one.axis)).toEqual([
      "horizontal",
      "vertical",
    ]);
    expect(result.layout.measurements.labelWidth.status).toBe("derived");
    expect(result.layout.measurements.labelHeight.status).toBe("derived");
    // The entered values on both axes are untouched by the other's solution.
    expect(result.layout.measurements.marginLeft.status).toBe("parsed");
  });

  it("does not derive two dimensions on the same axis", () => {
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
    expect(result.derivation.horizontal).toEqual({
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

  it("restates a resolved layout as normalized geometry", () => {
    const result = resolveSheetLayout(withRadius("known", "2"));
    if (result.status !== "resolved") {
      throw new Error("Expected the complete sheet to resolve.");
    }

    expect(result.layout.geometry).toEqual({
      sheet: { widthMm: 210, heightMm: 297 },
      grid: { rows: 7, columns: 3 },
      label: { widthMm: 60, heightMm: 38 },
      margins: { topMm: 9.5, rightMm: 10, bottomMm: 9.5, leftMm: 10 },
      gaps: { horizontalMm: 5, verticalMm: 2 },
      cornerRadius: { state: "known", radiusMm: 2 },
    });
  });

  it("keeps an unknown radius distinct from zero in the geometry", () => {
    for (const state of ["zero", "unknown"] as const) {
      const result = resolveSheetLayout(
        withCornerRadiusState(sheet(), state, "mm"),
      );
      if (result.status !== "resolved") {
        throw new Error(`Expected a ${state} radius to resolve.`);
      }

      expect(result.layout.geometry.cornerRadius).toEqual({ state });
    }
  });

  it("refuses readable entries that describe an impossible sheet", () => {
    const result = resolveSheetLayout(sheet({ marginRight: "20" }));
    if (result.status !== "refused") {
      throw new Error("Expected contradictory extents to be refused.");
    }

    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0].code).toBe("geometry-extent-contradiction");
    // Nothing resolved is handed back: a refused sheet has no value to hold.
    expect(result).not.toHaveProperty("layout");
  });

  it("judges a derived value like any other before accepting it", () => {
    // The equation happily supplies an 80 mm label width, but the negative gap
    // it was derived from overlaps every neighbouring label.
    const result = resolveSheetLayout(
      sheet({ labelWidth: "", horizontalGap: "-25" }),
    );
    if (result.status !== "refused") {
      throw new Error("Expected the derived geometry to be refused.");
    }

    expect(result.refusals[0].code).toBe("geometry-labels-overlap");
  });

  it("refuses a radius larger than half the shorter label side", () => {
    const result = resolveSheetLayout(withRadius("estimated", "25"));
    if (result.status !== "refused") {
      throw new Error("Expected an overlarge radius to be refused.");
    }

    expect(result.refusals[0]).toMatchObject({
      code: "geometry-radius-exceeds-label",
      fields: ["cornerRadius", "labelWidth", "labelHeight"],
    });
  });

  it("leaves every entry exactly as typed when geometry is refused", () => {
    const input = sheet({ marginRight: "20" });
    const before = structuredClone(input);

    expect(resolveSheetLayout(input).status).toBe("refused");
    expect(input).toEqual(before);
  });
});
