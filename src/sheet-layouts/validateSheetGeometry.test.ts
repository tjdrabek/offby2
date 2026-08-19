import { describe, expect, it } from "vitest";
import {
  axisContentExtent,
  geometryMeasurements,
  geometryRefusalIssues,
  labelTracks,
  validateSheetGeometry,
  type SheetGeometryRefusal,
} from "./validateSheetGeometry";
import {
  MAX_GRID_COUNT,
  type CornerRadiusDisclosure,
  type Millimetres,
  type SheetGeometry,
} from "./SheetGeometry";
import type { MeasurementFieldId } from "./SheetLayoutInput";
import { measurementFrom } from "./measurementUnits";

/**
 * An A4 sheet of 21 labels. Both axis equations balance exactly:
 * 210 = 7.25 + 3 × 63.5 + 2 × 2.5 + 7.25, and 297 = 15.15 + 7 × 38.1 + 15.15.
 */
const BASE: Record<MeasurementFieldId, number> = {
  sheetWidth: 210,
  sheetHeight: 297,
  labelWidth: 63.5,
  labelHeight: 38.1,
  marginTop: 15.15,
  marginRight: 7.25,
  marginBottom: 15.15,
  marginLeft: 7.25,
  horizontalGap: 2.5,
  verticalGap: 0,
};

interface Overrides extends Partial<Record<MeasurementFieldId, number>> {
  rows?: number;
  columns?: number;
  cornerRadius?: CornerRadiusDisclosure;
}

/**
 * Builds geometry from plain numbers.
 *
 * The brand is applied by assertion rather than by {@link millimetres} on
 * purpose: a value reaching the validator from durable storage or an imported
 * workspace never passed through that constructor, so the non-finite cases
 * below have to be expressible here.
 */
function sheet(overrides: Overrides = {}): SheetGeometry {
  const mm = (field: MeasurementFieldId) =>
    (overrides[field] ?? BASE[field]) as Millimetres;
  return {
    sheet: { widthMm: mm("sheetWidth"), heightMm: mm("sheetHeight") },
    grid: { rows: overrides.rows ?? 7, columns: overrides.columns ?? 3 },
    label: { widthMm: mm("labelWidth"), heightMm: mm("labelHeight") },
    margins: {
      topMm: mm("marginTop"),
      rightMm: mm("marginRight"),
      bottomMm: mm("marginBottom"),
      leftMm: mm("marginLeft"),
    },
    gaps: { horizontalMm: mm("horizontalGap"), verticalMm: mm("verticalGap") },
    cornerRadius: overrides.cornerRadius ?? { state: "zero" },
  };
}

function refusalsOf(
  geometry: SheetGeometry,
  media?: string,
): readonly SheetGeometryRefusal[] {
  const result = validateSheetGeometry(geometry, media);
  return result.status === "refused" ? result.refusals : [];
}

function codesOf(geometry: SheetGeometry, media?: string): string[] {
  return refusalsOf(geometry, media).map((refusal) => refusal.code);
}

describe("validateSheetGeometry", () => {
  it("accepts a uniform grid whose axis equations balance", () => {
    expect(validateSheetGeometry(sheet())).toEqual({ status: "valid" });
  });

  it("accepts geometry normalized from inches despite conversion dust", () => {
    const inches = (value: number) => measurementFrom(value, "in");

    const result = validateSheetGeometry({
      sheet: { widthMm: inches(8.5), heightMm: inches(11) },
      grid: { rows: 6, columns: 3 },
      label: { widthMm: inches(2.5), heightMm: inches(1.5) },
      margins: {
        topMm: inches(0.5),
        rightMm: inches(0.25),
        bottomMm: inches(0.5),
        leftMm: inches(0.25),
      },
      gaps: { horizontalMm: inches(0.25), verticalMm: inches(0.2) },
      cornerRadius: { state: "unknown" },
    });

    expect(result).toEqual({ status: "valid" });
  });

  describe("numeric refusals", () => {
    it.each([
      ["sheetWidth", Number.POSITIVE_INFINITY],
      ["labelHeight", Number.NaN],
      ["marginLeft", Number.NEGATIVE_INFINITY],
    ] as const)("refuses a non-finite %s", (field, value) => {
      const [refusal, ...rest] = refusalsOf(sheet({ [field]: value }));

      expect(refusal.code).toBe("geometry-not-finite");
      expect(refusal.fields).toEqual([field]);
      expect(refusal.message).toContain("finite");
      // The axis it belongs to is not also reported as contradictory.
      expect(rest).toEqual([]);
    });

    it.each([
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
    ] as const)("refuses a negative %s by name", (field) => {
      const [refusal] = refusalsOf(sheet({ [field]: -1 }));

      expect(refusal.code).toBe("geometry-negative");
      expect(refusal.fields).toEqual([field]);
      expect(refusal.message).toContain("-1 mm");
    });

    it.each([
      ["sheetWidth", 0],
      ["sheetHeight", -297],
      ["labelWidth", 0],
      ["labelHeight", -1],
    ] as const)("refuses %s that is not greater than zero", (field, value) => {
      const [refusal] = refusalsOf(sheet({ [field]: value }));

      expect(refusal.code).toBe("geometry-not-positive");
      expect(refusal.fields).toEqual([field]);
      expect(refusal.message).toContain("greater than zero");
    });

    it.each([0, -3, 2.5, MAX_GRID_COUNT + 1, Number.NaN])(
      "refuses %s as a row count",
      (rows) => {
        const [refusal] = refusalsOf(sheet({ rows }));

        expect(refusal.code).toBe("geometry-count-unusable");
        expect(refusal.fields).toEqual(["rows"]);
      },
    );
  });

  describe("extent refusals", () => {
    it("refuses a horizontal gap on a single-column sheet", () => {
      // 210 = 7.25 + 1 x 195.5 + 7.25 reconciles; the gap is the one claim
      // the sheet cannot carry, and the vanished term would never catch it.
      const [refusal, ...rest] = refusalsOf(
        sheet({ columns: 1, labelWidth: 195.5, horizontalGap: 2.5 }),
      );

      expect(refusal.code).toBe("geometry-gap-single-count");
      expect(refusal.fields).toEqual(["horizontalGap", "columns"]);
      expect(refusal.message).toContain("single column");
      expect(rest).toEqual([]);
    });

    it("refuses a vertical gap on a single-row sheet", () => {
      const [refusal] = refusalsOf(
        sheet({ rows: 1, labelHeight: 266.7, verticalGap: 2 }),
      );

      expect(refusal.code).toBe("geometry-gap-single-count");
      expect(refusal.fields).toEqual(["verticalGap", "rows"]);
    });

    it("accepts a zero gap on a single-column sheet", () => {
      const geometry = sheet({
        columns: 1,
        labelWidth: 195.5,
        horizontalGap: 0,
      });

      expect(validateSheetGeometry(geometry)).toEqual({ status: "valid" });
    });

    it("refuses a negative gap as the overlap it produces", () => {
      const [refusal, ...rest] = refusalsOf(
        sheet({ horizontalGap: -2, marginLeft: 16.25, marginRight: 3.25 }),
      );

      expect(refusal.code).toBe("geometry-labels-overlap");
      expect(refusal.fields).toEqual([
        "horizontalGap",
        "labelWidth",
        "columns",
      ]);
      expect(refusal.message).toContain("overlap column 1 by 2 mm");
      expect(rest).toEqual([]);
    });

    it("refuses a grid whose labels cross the sheet edge", () => {
      const [refusal] = refusalsOf(sheet({ marginLeft: 20 }));

      expect(refusal.code).toBe("geometry-labels-outside-sheet");
      expect(refusal.fields[0]).toBe("sheetWidth");
      expect(refusal.message).toContain("column 3 runs from");
      expect(refusal.message).toContain("must lie within the sheet");
    });

    it("refuses parts that add up to more than the sheet", () => {
      const [refusal] = refusalsOf(sheet({ marginRight: 20 }));

      expect(refusal.code).toBe("geometry-extent-contradiction");
      expect(refusal.message).toContain("222.75 mm");
      expect(refusal.message).toContain("Sheet width is 210 mm");
    });

    it("refuses parts that leave the sheet unaccounted for", () => {
      const [refusal] = refusalsOf(sheet({ marginBottom: 5 }));

      expect(refusal.code).toBe("geometry-extent-contradiction");
      expect(refusal.message).toContain("286.85 mm");
      expect(refusal.message).toContain("Sheet height is 297 mm");
    });

    it("names every operand of the axis it refuses", () => {
      const [refusal] = refusalsOf(sheet({ marginRight: 20 }));

      expect(refusal.fields).toEqual([
        "sheetWidth",
        "marginLeft",
        "labelWidth",
        "horizontalGap",
        "marginRight",
        "columns",
      ]);
    });

    it("refuses each axis independently", () => {
      expect(codesOf(sheet({ marginRight: 20, marginBottom: 5 }))).toEqual([
        "geometry-extent-contradiction",
        "geometry-extent-contradiction",
      ]);
    });

    it("does not let the comparison epsilon excuse a visible mismatch", () => {
      expect(codesOf(sheet({ sheetWidth: 210.001 }))).toEqual([
        "geometry-extent-contradiction",
      ]);
      // A thousandth of that difference is floating-point dust, not geometry.
      expect(codesOf(sheet({ sheetWidth: 210 + 1e-9 }))).toEqual([]);
    });

    it("refuses both gaps of a single-label sheet, one per axis", () => {
      expect(
        codesOf(
          sheet({
            rows: 1,
            columns: 1,
            labelWidth: 195.5,
            labelHeight: 266.7,
            horizontalGap: 12,
            verticalGap: 4,
          }),
        ),
      ).toEqual(["geometry-gap-single-count", "geometry-gap-single-count"]);
    });

    it("accepts a single row and column once its gaps are zero", () => {
      const geometry = sheet({
        rows: 1,
        columns: 1,
        labelWidth: 195.5,
        labelHeight: 266.7,
        horizontalGap: 0,
        verticalGap: 0,
      });

      expect(validateSheetGeometry(geometry)).toEqual({ status: "valid" });
    });
  });

  describe("corner radius refusals", () => {
    it("refuses a radius larger than half the shorter label side", () => {
      const [refusal] = refusalsOf(
        sheet({
          cornerRadius: { state: "known", radiusMm: 20 as Millimetres },
        }),
      );

      expect(refusal.code).toBe("geometry-radius-exceeds-label");
      expect(refusal.fields).toEqual([
        "cornerRadius",
        "labelWidth",
        "labelHeight",
      ]);
      expect(refusal.message).toContain("19.05 mm or less");
    });

    it("accepts a radius of exactly half the shorter label side", () => {
      expect(
        codesOf(
          sheet({
            cornerRadius: {
              state: "estimated",
              radiusMm: 19.05 as Millimetres,
            },
          }),
        ),
      ).toEqual([]);
    });

    it("refuses a negative radius", () => {
      const [refusal] = refusalsOf(
        sheet({
          cornerRadius: { state: "known", radiusMm: -1 as Millimetres },
        }),
      );

      expect(refusal.code).toBe("geometry-negative");
      expect(refusal.fields).toEqual(["cornerRadius"]);
    });

    it("checks nothing for an unknown radius, which claims nothing", () => {
      expect(codesOf(sheet({ cornerRadius: { state: "unknown" } }))).toEqual(
        [],
      );
    });

    it("waits for a usable label size before judging the radius", () => {
      expect(
        codesOf(
          sheet({
            labelWidth: 0,
            cornerRadius: { state: "known", radiusMm: 500 as Millimetres },
          }),
        ),
      ).toEqual(["geometry-not-positive"]);
    });
  });

  describe("unsupported media", () => {
    it.each([
      "roll",
      "continuous",
      "thermal-continuous",
      "duplex",
      "circular-labels",
      "oval-labels",
      "arbitrary-die-cut",
      "non-uniform-grid",
      "non-rectangular-sheet",
    ])("refuses %s media outright", (media) => {
      const refusals = refusalsOf(sheet(), media);

      expect(refusals).toHaveLength(1);
      expect(refusals[0].code).toBe("geometry-unsupported-media");
      expect(refusals[0].fields).toEqual([]);
    });

    it("refuses unsupported media before measuring anything about it", () => {
      // The geometry is also contradictory; the media is the only thing said.
      expect(codesOf(sheet({ marginRight: 20 }), "roll")).toEqual([
        "geometry-unsupported-media",
      ]);
    });
  });

  it("never adjusts, clamps, or rounds the geometry it judges", () => {
    const geometry = sheet({ marginRight: 20, labelWidth: 63.5001 });
    const before = structuredClone(geometry);

    const result = validateSheetGeometry(geometry);

    expect(geometry).toEqual(before);
    expect(result.status).toBe("refused");
    expect(result).not.toHaveProperty("geometry");
  });

  it("gives every refusal a stable code, named fields, and a message", () => {
    for (const refusal of refusalsOf(
      sheet({ marginRight: 20, rows: 0, labelHeight: -1 }),
    )) {
      expect(refusal.code).toMatch(/^geometry-[a-z-]+$/);
      expect(refusal.message.length).toBeGreaterThan(20);
      expect(refusal.fields.length).toBeGreaterThan(0);
    }
  });
});

describe("labelTracks", () => {
  it("places every label at a uniform pitch from the leading margin", () => {
    expect(labelTracks(7.25, 63.5, 2.5, 3)).toEqual([
      { index: 0, startMm: 7.25, endMm: 70.75 },
      { index: 1, startMm: 73.25, endMm: 136.75 },
      { index: 2, startMm: 139.25, endMm: 202.75 },
    ]);
  });

  it("places a single label with no pitch to apply", () => {
    expect(labelTracks(10, 50, 99, 1)).toEqual([
      { index: 0, startMm: 10, endMm: 60 },
    ]);
  });
});

describe("axisContentExtent", () => {
  it("sums the axis equation the sheet is described by", () => {
    expect(axisContentExtent(7.25, 63.5, 2.5, 7.25, 3)).toBe(210);
  });

  it("drops the gap entirely for a single label", () => {
    expect(axisContentExtent(10, 50, 99, 10, 1)).toBe(70);
  });
});

describe("geometryMeasurements", () => {
  it("reads every dimensional value back by field", () => {
    expect(geometryMeasurements(sheet())).toEqual(BASE);
  });
});

describe("geometryRefusalIssues", () => {
  it("attaches a refusal to every field it names", () => {
    const issues = geometryRefusalIssues([
      {
        code: "geometry-extent-contradiction",
        fields: ["sheetWidth", "marginLeft"],
        message: "Do not fit.",
      },
    ]);

    expect(issues).toEqual([
      {
        field: "sheetWidth",
        code: "geometry-extent-contradiction",
        explanation: "Do not fit.",
        remedies: [],
        message: "Do not fit.",
      },
      {
        field: "marginLeft",
        code: "geometry-extent-contradiction",
        explanation: "Do not fit.",
        remedies: [],
        message: "Do not fit.",
      },
    ]);
  });

  it("leaves a field-less refusal to the summary alone", () => {
    expect(
      geometryRefusalIssues([
        {
          code: "geometry-unsupported-media",
          fields: [],
          message: "Roll stock cannot be described.",
        },
      ]),
    ).toEqual([]);
  });
});
