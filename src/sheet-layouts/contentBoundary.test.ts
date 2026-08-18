import { describe, expect, it } from "vitest";
import {
  contentBoundary,
  type DesignFrame,
  type HoldInLine,
} from "../index";

/** An upright frame roomy enough that the half-extent clamp never bites. */
const roomyFrame: DesignFrame = {
  orientation: "upright",
  widthMm: 40,
  heightMm: 30,
};

describe("contentBoundary", () => {
  it("takes the most obtrusive line on each axis, not the sum", () => {
    // Sides: the 2.5 mm allowance beats a 1 mm content inset. Down: the inset stands.
    const boundary = contentBoundary(
      {
        contentInset: { axes: "frame", xMm: 1, yMm: 1 },
        cutoff: { axes: "sheet", xMm: 2.5, yMm: 0 },
      },
      roomyFrame,
    );
    expect(boundary.xMm).toBe(2.5);
    expect(boundary.yMm).toBe(1);
  });

  it("lets the content inset win where it is the further line", () => {
    const boundary = contentBoundary(
      {
        contentInset: { axes: "frame", xMm: 4, yMm: 3 },
        cutoff: { axes: "sheet", xMm: 2.5, yMm: 0 },
      },
      roomyFrame,
    );
    expect(boundary.xMm).toBe(4);
    expect(boundary.yMm).toBe(3);
  });

  it("maps the sheet's axes onto a sideways frame", () => {
    // Turned a quarter turn, the frame's "across" runs along the sheet's
    // vertical axis: the y allowance is what its content inset competes with.
    const boundary = contentBoundary(
      {
        contentInset: { axes: "frame", xMm: 1, yMm: 1 },
        cutoff: { axes: "sheet", xMm: 2.5, yMm: 0.5 },
      },
      { ...roomyFrame, orientation: "sideways" },
    );
    expect(boundary.xMm).toBe(1);
    expect(boundary.yMm).toBe(2.5);
  });

  it("is just the content inset when nothing else holds", () => {
    const boundary = contentBoundary(
      { contentInset: { axes: "frame", xMm: 1.5, yMm: 0.75 } },
      roomyFrame,
    );
    expect(boundary.xMm).toBe(1.5);
    expect(boundary.yMm).toBe(0.75);
  });

  it("holds unequal sheet-axis allowances against the right sideways edges", () => {
    // Sides cut deeper than tops on the sheet; on a sideways frame those
    // side lines run along the frame's height, the tops along its width.
    const boundary = contentBoundary(
      { cutoff: { axes: "sheet", xMm: 3, yMm: 1 } },
      { orientation: "sideways", widthMm: 40, heightMm: 30 },
    );
    expect(boundary.xMm).toBe(1);
    expect(boundary.yMm).toBe(3);
  });

  it("answers each line at its own distance when the lines cross", () => {
    // The inset sits inside the cut-off line across the frame, outside it
    // down the frame — a guide renderer needs both true positions.
    const boundary = contentBoundary(
      {
        contentInset: { axes: "frame", xMm: 1, yMm: 2 },
        cutoff: { axes: "sheet", xMm: 3, yMm: 0.5 },
      },
      roomyFrame,
    );
    expect(boundary.xMm).toBe(3);
    expect(boundary.yMm).toBe(2);
    expect(boundary.lines).toEqual({
      contentInset: { xMm: 1, yMm: 2 },
      cutoff: { xMm: 3, yMm: 0.5 },
    });
  });

  it("holds the boundary to less than half a narrow frame's extent", () => {
    // A 4 mm-wide frame leaves at most 1.5 mm per side; the length of the
    // frame still has its own room, judged against its own extent.
    const boundary = contentBoundary(
      { contentInset: { axes: "frame", xMm: 3, yMm: 3 } },
      { orientation: "upright", widthMm: 4, heightMm: 30 },
    );
    expect(boundary.xMm).toBe(1.5);
    expect(boundary.yMm).toBe(3);
    // The per-line answer is held the same way, so a guide line drawn from
    // it can never sit past the middle of the frame.
    expect(boundary.lines.contentInset).toEqual({ xMm: 1.5, yMm: 3 });
  });
});

describe("contentBoundary properties", () => {
  /**
   * A deterministic linear congruential generator, so the property runs the
   * same cases on every machine without a property-testing dependency.
   */
  const nextRandom = (() => {
    let seed = 0x2f6e2b1;
    return () => {
      seed = (seed * 1103515245 + 12345) % 0x80000000;
      return seed / 0x80000000;
    };
  })();

  const someFrame = (): DesignFrame => ({
    orientation: nextRandom() < 0.5 ? "upright" : "sideways",
    widthMm: 1 + nextRandom() * 59,
    heightMm: 1 + nextRandom() * 59,
  });

  const someLines = (): { [name: string]: HoldInLine } => {
    const lines: { [name: string]: HoldInLine } = {};
    const count = Math.floor(nextRandom() * 5);
    for (let index = 0; index < count; index += 1) {
      lines[`line${index}`] = {
        axes: nextRandom() < 0.5 ? "sheet" : "frame",
        xMm: nextRandom() * 20,
        yMm: nextRandom() * 20,
      };
    }
    return lines;
  };

  it("equals the most obtrusive held line per axis", () => {
    for (let run = 0; run < 300; run += 1) {
      const boundary = contentBoundary(someLines(), someFrame());
      const held = Object.values(boundary.lines);
      expect(boundary.xMm).toBe(Math.max(0, ...held.map((line) => line.xMm)));
      expect(boundary.yMm).toBe(Math.max(0, ...held.map((line) => line.yMm)));
    }
  });

  it("is unchanged by rotating the frame and swapping sheet-axis coordinates", () => {
    // The same physical holding described the other way up: the frame turned
    // a quarter turn, and every sheet-axis line's coordinates read across
    // instead of down. One description must not answer differently from the
    // other, or a preview and a printable output could disagree.
    for (let run = 0; run < 300; run += 1) {
      const lines = someLines();
      const frame = someFrame();

      const rotatedFrame: DesignFrame = {
        ...frame,
        orientation: frame.orientation === "upright" ? "sideways" : "upright",
      };
      const swappedLines = Object.fromEntries(
        Object.entries(lines).map(([name, line]) => [
          name,
          line.axes === "sheet"
            ? { ...line, xMm: line.yMm, yMm: line.xMm }
            : line,
        ]),
      );

      expect(contentBoundary(swappedLines, rotatedFrame)).toEqual(
        contentBoundary(lines, frame),
      );
    }
  });
});
