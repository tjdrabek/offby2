import { describe, expect, it } from "vitest";
import { SHEET_LAYOUT_PRESETS, sheetLayoutPreset } from "./presets";
import { resolveSheetLayout } from "./resolveSheetLayout";
import { labelCount } from "./labelPositions";
import { matchStandardSheetSize } from "./standardSheetSizes";

describe("sheet layout presets", () => {
  it("gives every preset a distinct id", () => {
    const ids = SHEET_LAYOUT_PRESETS.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no preset for an unknown id", () => {
    expect(sheetLayoutPreset("not-a-product")).toBeUndefined();
  });

  it.each(SHEET_LAYOUT_PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s describes a sheet that can exist",
    (_name, preset) => {
      const result = resolveSheetLayout(preset.input);
      if (result.status !== "resolved") {
        // A preset that does not resolve is catalog data that would be shown to
        // an operator as an error they did not cause.
        throw new Error(
          `Expected the preset to resolve, got ${result.status}: ${JSON.stringify(result)}`,
        );
      }

      // Published figures are complete: nothing should need deriving.
      expect(result.layout.derivations).toEqual([]);
      expect(labelCount(result.layout.geometry)).toBeGreaterThan(0);
    },
  );

  it.each(SHEET_LAYOUT_PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s sits on the standard sheet it names",
    (_name, preset) => {
      const result = resolveSheetLayout(preset.input);
      if (result.status !== "resolved") {
        throw new Error("Expected the preset to resolve.");
      }

      const { sheet } = result.layout.geometry;
      const matched = matchStandardSheetSize(sheet.widthMm, sheet.heightMm);
      const expected = preset.sheet === "Letter" ? "letter" : "a4";

      expect(matched?.id).toBe(expected);
    },
  );

  it("resolves every preset with its label size left to be derived", () => {
    // The demo blanks both label dimensions and lets the axis equations supply
    // them; a preset whose figures do not reconcile would fail here first.
    for (const preset of SHEET_LAYOUT_PRESETS) {
      const withoutLabelSize = {
        ...preset.input,
        measurements: {
          ...preset.input.measurements,
          labelWidth: { ...preset.input.measurements.labelWidth, text: "" },
          labelHeight: { ...preset.input.measurements.labelHeight, text: "" },
        },
      };
      const result = resolveSheetLayout(withoutLabelSize);
      if (result.status !== "resolved") {
        throw new Error(`${preset.id} did not resolve: ${result.status}`);
      }

      expect(result.layout.derivations.map((one) => one.field)).toEqual([
        "labelWidth",
        "labelHeight",
      ]);
      // The derived size agrees with the published one it replaced.
      const entered = resolveSheetLayout(preset.input);
      if (entered.status !== "resolved") {
        throw new Error("Expected the published figures to resolve.");
      }
      expect(result.layout.geometry.label.widthMm).toBeCloseTo(
        entered.layout.geometry.label.widthMm,
        9,
      );
      expect(result.layout.geometry.label.heightMm).toBeCloseTo(
        entered.layout.geometry.label.heightMm,
        9,
      );
    }
  });
});
