import { describe, expect, it } from "vitest";
import {
  BOUNDARY_X_VAR,
  BOUNDARY_Y_VAR,
  contentBoundaryCssVars,
  lineCssVarNames,
} from "../web";
import type { DesignFrame } from "../index";

const frame: DesignFrame = {
  orientation: "upright",
  widthMm: 40,
  heightMm: 20,
};

describe("contentBoundaryCssVars", () => {
  it("maps a boundary and its lines onto the documented custom properties", () => {
    const vars = contentBoundaryCssVars(
      {
        padding: { axes: "frame", xMm: 4, yMm: 1 },
        cutoff: { axes: "sheet", xMm: 2, yMm: 3 },
      },
      frame,
    );
    expect(vars).toEqual({
      "--offby2-boundary-x": "10",
      "--offby2-boundary-y": "15",
      "--offby2-line-padding-x": "10",
      "--offby2-line-padding-y": "5",
      "--offby2-line-cutoff-x": "5",
      "--offby2-line-cutoff-y": "15",
    });
  });

  it("turns a sheet-axis line with a sideways frame", () => {
    const vars = contentBoundaryCssVars(
      { cutoff: { axes: "sheet", xMm: 3, yMm: 1 } },
      { orientation: "sideways", widthMm: 40, heightMm: 20 },
    );
    // The sheet's 3 mm sides land on the frame's height: 3 of 20 is 15%.
    expect(vars[BOUNDARY_X_VAR]).toBe("2.5");
    expect(vars[BOUNDARY_Y_VAR]).toBe("15");
  });

  it("is empty of lines when no line holds", () => {
    expect(contentBoundaryCssVars({}, frame)).toEqual({
      "--offby2-boundary-x": "0",
      "--offby2-boundary-y": "0",
    });
  });

  it("names a line's properties the way a stylesheet can predict", () => {
    expect(lineCssVarNames("cutoff")).toEqual({
      xVar: "--offby2-line-cutoff-x",
      yVar: "--offby2-line-cutoff-y",
    });
  });
});
