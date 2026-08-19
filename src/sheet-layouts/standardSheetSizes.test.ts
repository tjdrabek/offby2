import { describe, expect, it } from "vitest";
import { measurementFrom } from "./measurementUnits.js";
import {
  STANDARD_SHEET_SIZES,
  matchStandardSheetSize,
  standardSheetSize,
} from "./standardSheetSizes.js";

describe("standard sheet sizes", () => {
  it("defines A sizes in whole millimetres", () => {
    expect(standardSheetSize("a4")).toMatchObject({
      widthMm: 210,
      heightMm: 297,
    });
  });

  it("converts US sizes from the inches they are defined in", () => {
    expect(standardSheetSize("letter")).toMatchObject({
      widthMm: measurementFrom(8.5, "in"),
      heightMm: measurementFrom(11, "in"),
    });
  });

  it("recognises a size entered back at rounded entry precision", () => {
    // A4 converted to inches is entered as 8.27 × 11.69 — still A4.
    expect(
      matchStandardSheetSize(
        measurementFrom(8.27, "in"),
        measurementFrom(11.69, "in"),
      ),
    ).toMatchObject({ id: "a4" });
  });

  it("has no size for an unknown id", () => {
    expect(standardSheetSize("foolscap")).toBeUndefined();
  });

  it("gives every size a distinct id", () => {
    const ids = STANDARD_SHEET_SIZES.map((size) => size.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every size a distinct pair of dimensions", () => {
    // Two names for one size would make matchStandardSheetSize's answer depend
    // on list order, and one of the two would be unreachable.
    const shapes = STANDARD_SHEET_SIZES.map(
      (size) => `${size.widthMm.toFixed(3)}x${size.heightMm.toFixed(3)}`,
    );

    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it("names every size with the dimensions it defines", () => {
    // The label is what an operator picks from, so a stale one is a wrong entry
    // waiting to happen rather than a cosmetic problem.
    for (const size of STANDARD_SHEET_SIZES) {
      const [, figures] = size.name.split(" — ");
      const [width, height] = figures.replace(/[^\d.×]/g, "").split("×");
      const unit = figures.endsWith("in") ? "in" : "mm";

      expect(size.widthMm).toBeCloseTo(measurementFrom(Number(width), unit), 6);
      expect(size.heightMm).toBeCloseTo(
        measurementFrom(Number(height), unit),
        6,
      );
    }
  });

  /**
   * Every entry a consumer print dialog offers, with the dimensions that name
   * means. Taken from a Brother HL-L2340D driver's paper-size list, which is a
   * representative superset of what these printers offer.
   */
  const DRIVER_PAPER_SIZES: readonly [string, number, number][] = [
    ["A4", 210, 297],
    ["Letter", 215.9, 279.4],
    ["Legal", 215.9, 355.6],
    ["Executive", 184.15, 266.7],
    ["A5", 148, 210],
    ["A5 Long Edge", 210, 148],
    ["A6", 105, 148],
    ["B5", 182, 257],
    ["Com-10", 104.775, 241.3],
    ["DL", 110, 220],
    ["C5", 162, 229],
    ["Monarch", 98.425, 190.5],
    ["3 x 5", 76.2, 127],
    ["Folio", 215.9, 330.2],
    ["A3", 297, 420],
    ["Ledger", 431.8, 279.4],
  ];

  it.each(DRIVER_PAPER_SIZES)(
    "covers the %s a print dialog offers",
    (_name, widthMm, heightMm) => {
      expect(matchStandardSheetSize(widthMm, heightMm)).toBeDefined();
    },
  );
});

describe("matchStandardSheetSize", () => {
  it("recognises a size entered exactly", () => {
    expect(matchStandardSheetSize(210, 297)?.id).toBe("a4");
  });

  it("recognises a size across the dust left by unit conversion", () => {
    // 8.5 in normalizes to 215.89999999999998 mm; a sheet entered as 215.9 mm
    // is the same piece of paper.
    expect(matchStandardSheetSize(215.9, 279.4)?.id).toBe("letter");
    expect(
      matchStandardSheetSize(
        measurementFrom(8.5, "in"),
        measurementFrom(11, "in"),
      )?.id,
    ).toBe("letter");
  });

  it("does not infer orientation", () => {
    // A rotated sheet is a different entry, not the same size turned around.
    expect(matchStandardSheetSize(297, 210)).toBeUndefined();
  });

  it("has no match for a sheet that is not a standard size", () => {
    expect(matchStandardSheetSize(200, 300)).toBeUndefined();
  });

  it("does not match a sheet a millimetre out", () => {
    expect(matchStandardSheetSize(211, 297)).toBeUndefined();
  });
});
