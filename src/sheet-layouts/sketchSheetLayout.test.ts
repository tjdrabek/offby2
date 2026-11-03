import { describe, expect, it } from "vitest";
import {
  createEmptySheetLayoutInput,
  type LengthUnit,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput.js";
import { resolveSheetLayout } from "./resolveSheetLayout.js";
import { sketchSheetLayout } from "./sketchSheetLayout.js";

/** Only the fields given are filled in; the rest stay blank. */
function entered(
  unit: LengthUnit,
  measurements: Partial<Record<MeasurementFieldId, string>>,
  counts: { rows?: string; columns?: string } = {},
): SheetLayoutSourceInput {
  const input = createEmptySheetLayoutInput(unit);
  const filled = { ...input.measurements };
  for (const [field, text] of Object.entries(measurements) as [
    MeasurementFieldId,
    string,
  ][]) {
    filled[field] = { text, unit };
  }
  return {
    ...input,
    measurements: filled,
    counts: {
      rows: { text: counts.rows ?? "" },
      columns: { text: counts.columns ?? "" },
    },
  };
}

/** US Letter, 3 × 10 with a 0.5 in top and bottom margin and butt-cut labels. */
const LETTER_3_BY_10 = {
  measurements: {
    sheetWidth: "8.5",
    sheetHeight: "11",
    marginTop: "0.5",
    marginBottom: "0.5",
    marginLeft: "0.19",
    marginRight: "0.19",
    horizontalGap: "0.12",
    verticalGap: "0",
  } satisfies Partial<Record<MeasurementFieldId, string>>,
  counts: { rows: "10", columns: "3" },
};

describe("sketchSheetLayout", () => {
  it("knows nothing about an empty input, and says which fields each axis waits on", () => {
    const sketch = sketchSheetLayout(createEmptySheetLayoutInput("in"));

    expect(sketch.sheet).toEqual({ widthMm: null, heightMm: null });
    expect(sketch.geometry).toBeNull();
    expect(sketch.horizontal).toEqual({
      status: "incomplete",
      axis: "horizontal",
      missing: [
        "sheetWidth",
        "marginLeft",
        "labelWidth",
        "horizontalGap",
        "marginRight",
        "columns",
      ],
    });
    expect(sketch.vertical.status).toBe("incomplete");
  });

  it("has the paper as soon as its two extents parse", () => {
    const sketch = sketchSheetLayout(
      entered("in", { sheetWidth: "8.5", sheetHeight: "11" }),
    );

    expect(sketch.sheet.widthMm).toBeCloseTo(215.9, 9);
    expect(sketch.sheet.heightMm).toBeCloseTo(279.4, 9);
    expect(sketch.horizontal.status).toBe("incomplete");
    expect(sketch.geometry).toBeNull();
  });

  it("shades each margin on its own as it is typed", () => {
    const sketch = sketchSheetLayout(
      entered("mm", { sheetWidth: "210", marginLeft: "7.5" }),
    );

    expect(sketch.margins.leftMm).toBe(7.5);
    expect(sketch.margins.rightMm).toBeNull();
    expect(sketch.margins.topMm).toBeNull();
  });

  it("lays one axis out before the other has a count", () => {
    const sketch = sketchSheetLayout(
      entered(
        "in",
        {
          sheetWidth: "8.5",
          sheetHeight: "11",
          marginTop: "0.5",
          marginBottom: "0.5",
          verticalGap: "0",
        },
        { rows: "10" },
      ),
    );

    expect(sketch.vertical.status).toBe("laid-out");
    if (sketch.vertical.status !== "laid-out") {
      throw new Error("unreachable");
    }
    expect(sketch.vertical.layout.count).toBe(10);
    expect(sketch.vertical.layout.derived).toBe("labelHeight");
    // (11 − 0.5 − 0.5) / 10 = 1 in.
    expect(sketch.vertical.layout.sizeMm).toBeCloseTo(25.4, 9);
    expect(sketch.horizontal.status).toBe("incomplete");
    expect(sketch.geometry).toBeNull();
  });

  it("refuses an axis whose paper is narrower than its margins and gaps, naming every field on it, in inches", () => {
    const sketch = sketchSheetLayout(
      entered(
        "in",
        {
          ...LETTER_3_BY_10.measurements,
          sheetWidth: "0.33",
          marginLeft: "0.1",
          marginRight: "0.1",
          horizontalGap: "0.1",
        },
        { rows: "2", columns: "4" },
      ),
    );

    expect(sketch.sheet.widthMm).toBeCloseTo(8.382, 9);
    expect(sketch.vertical.status).toBe("laid-out");
    expect(sketch.horizontal.status).toBe("refused");
    if (sketch.horizontal.status !== "refused") {
      throw new Error("unreachable");
    }
    expect(sketch.horizontal.code).toBe("derivation-negative");
    expect(sketch.horizontal.fields).toEqual([
      "labelWidth",
      "sheetWidth",
      "marginLeft",
      "horizontalGap",
      "marginRight",
      "columns",
    ]);
    expect(sketch.horizontal.message).toContain("-0.0425 in");
    expect(sketch.horizontal.message).not.toContain("mm");
  });

  it("refuses an axis whose entered labels do not fit, with the judge's own fields", () => {
    const sketch = sketchSheetLayout(
      entered(
        "mm",
        {
          sheetWidth: "210",
          marginLeft: "10",
          labelWidth: "100",
          horizontalGap: "5",
          marginRight: "10",
        },
        { columns: "3" },
      ),
    );

    expect(sketch.horizontal.status).toBe("refused");
    if (sketch.horizontal.status !== "refused") {
      throw new Error("unreachable");
    }
    expect(sketch.horizontal.code).toBe("geometry-labels-outside-sheet");
    expect(sketch.horizontal.fields).toContain("sheetWidth");
    expect(sketch.horizontal.message).toContain("Sheet width is 210 mm");
  });

  it("waits on an entry that will not read rather than guessing around it", () => {
    const sketch = sketchSheetLayout(
      entered(
        "in",
        { ...LETTER_3_BY_10.measurements, marginLeft: "abc" },
        LETTER_3_BY_10.counts,
      ),
    );

    expect(sketch.horizontal.status).toBe("incomplete");
    if (sketch.horizontal.status !== "incomplete") {
      throw new Error("unreachable");
    }
    expect(sketch.horizontal.missing).toEqual(["marginLeft", "labelWidth"]);
    expect(sketch.margins.leftMm).toBeNull();
  });

  it("carries the resolver's geometry once everything is in, and both axes agree with it", () => {
    const input = entered(
      "in",
      LETTER_3_BY_10.measurements,
      LETTER_3_BY_10.counts,
    );
    const sketch = sketchSheetLayout(input);
    const resolution = resolveSheetLayout(input);

    if (resolution.status !== "resolved") {
      throw new Error(`Expected a resolved layout, got ${resolution.status}.`);
    }
    expect(sketch.geometry).toEqual(resolution.layout.geometry);
    expect(sketch.horizontal.status).toBe("laid-out");
    expect(sketch.vertical.status).toBe("laid-out");
    if (
      sketch.horizontal.status !== "laid-out" ||
      sketch.vertical.status !== "laid-out"
    ) {
      throw new Error("unreachable");
    }
    expect(sketch.horizontal.layout.sizeMm).toBe(
      resolution.layout.geometry.label.widthMm,
    );
    expect(sketch.vertical.layout.sizeMm).toBe(
      resolution.layout.geometry.label.heightMm,
    );
    expect(sketch.horizontal.layout.derived).toBe("labelWidth");
    expect(sketch.grid).toEqual({ rows: 10, columns: 3 });
  });

  it("discloses the corners as entered, and withholds a radius that is not there yet", () => {
    const base = entered("mm", {});

    expect(sketchSheetLayout(base).cornerRadius).toEqual({ state: "zero" });
    expect(
      sketchSheetLayout({
        ...base,
        cornerRadius: { state: "unknown" },
      }).cornerRadius,
    ).toEqual({ state: "unknown" });
    expect(
      sketchSheetLayout({
        ...base,
        cornerRadius: { state: "known", value: { text: "", unit: "mm" } },
      }).cornerRadius,
    ).toBeNull();
    expect(
      sketchSheetLayout({
        ...base,
        cornerRadius: { state: "known", value: { text: "3", unit: "mm" } },
      }).cornerRadius,
    ).toEqual({ state: "known", radiusMm: 3 });
  });
});
