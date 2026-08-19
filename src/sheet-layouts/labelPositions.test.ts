import { describe, expect, it } from "vitest";
import { millimetres, type SheetGeometry } from "./SheetGeometry.js";
import { labelCount, labelPositions, sheetExtent } from "./labelPositions.js";

/** A 2 x 3 sheet with distinct label and gap sizes, so axes cannot be confused. */
function geometry(overrides: Partial<SheetGeometry> = {}): SheetGeometry {
  return {
    sheet: { widthMm: millimetres(100), heightMm: millimetres(80) },
    grid: { rows: 2, columns: 3 },
    label: { widthMm: millimetres(20), heightMm: millimetres(30) },
    margins: {
      topMm: millimetres(5),
      rightMm: millimetres(15),
      bottomMm: millimetres(35),
      leftMm: millimetres(10),
    },
    gaps: { horizontalMm: millimetres(2.5), verticalMm: millimetres(10) },
    cornerRadius: { state: "zero" },
    ...overrides,
  };
}

describe("labelPositions", () => {
  it("places every label in reading order", () => {
    const positions = labelPositions(geometry());

    expect(positions).toHaveLength(6);
    expect(positions.map((position) => [position.row, position.column])).toEqual(
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
    );
    expect(positions.map((position) => position.index)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  it("advances each axis by its own size and gap", () => {
    const positions = labelPositions(geometry());

    // Columns start at the left margin and advance by 20 + 2.5.
    expect(positions.slice(0, 3).map((position) => position.xMm)).toEqual([
      10, 32.5, 55,
    ]);
    // Rows start at the top margin and advance by 30 + 10.
    expect([positions[0].yMm, positions[3].yMm]).toEqual([5, 45]);
  });

  it("counts labels without building them", () => {
    expect(labelCount(geometry())).toBe(6);
    expect(labelCount(geometry({ grid: { rows: 10, columns: 3 } }))).toBe(30);
  });

  it("reports the sheet's own extent", () => {
    expect(sheetExtent(geometry())).toEqual({ widthMm: 100, heightMm: 80 });
  });

  describe("corner radius", () => {
    it("carries a disclosed radius onto every position", () => {
      const positions = labelPositions(
        geometry({ cornerRadius: { state: "known", radiusMm: millimetres(2) } }),
      );

      expect(
        positions.every((position) => position.cornerRadiusMm === 2),
      ).toBe(true);
    });

    it("reports zero for square corners", () => {
      expect(labelPositions(geometry())[0].cornerRadiusMm).toBe(0);
    });

    it("reports null when nobody has measured the corners", () => {
      const positions = labelPositions(
        geometry({ cornerRadius: { state: "unknown" } }),
      );

      // Not zero: a renderer must decide what to draw rather than be handed a
      // value that silently asserts square corners.
      expect(positions[0].cornerRadiusMm).toBeNull();
    });
  });
});

