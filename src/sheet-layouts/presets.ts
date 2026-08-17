/**
 * A small catalog of sheet layouts, expressed as source input rather than as
 * geometry.
 *
 * Presets are entries, not measurements. A consumer loads one into the same
 * fields an operator types into, so a published dimension is corrected the same
 * way a typed one is — and, crucially, so a preset is subject to exactly the
 * same validation. Nothing here is physically verified: these are published
 * figures, and the corner-radius disclosures say so.
 */

import type {
  CountFieldId,
  LengthUnit,
  MeasurementFieldId,
  SheetLayoutSourceInput,
} from "./SheetLayoutInput";

export interface SheetLayoutPreset {
  id: string;
  /** The label product this describes. */
  name: string;
  /** Sheet size in ordinary terms, for grouping in a picker. */
  sheet: "Letter" | "A4";
  description: string;
  input: SheetLayoutSourceInput;
}

type PresetNumbers = Record<MeasurementFieldId, number> &
  Record<CountFieldId, number>;

/** Builds the source input for a preset, in the unit its figures are published in. */
function presetInput(
  unit: LengthUnit,
  values: PresetNumbers,
  cornerRadius: SheetLayoutSourceInput["cornerRadius"],
): SheetLayoutSourceInput {
  const text = (value: number) => String(value);
  return {
    measurements: {
      sheetWidth: { text: text(values.sheetWidth), unit },
      sheetHeight: { text: text(values.sheetHeight), unit },
      labelWidth: { text: text(values.labelWidth), unit },
      labelHeight: { text: text(values.labelHeight), unit },
      marginTop: { text: text(values.marginTop), unit },
      marginRight: { text: text(values.marginRight), unit },
      marginBottom: { text: text(values.marginBottom), unit },
      marginLeft: { text: text(values.marginLeft), unit },
      horizontalGap: { text: text(values.horizontalGap), unit },
      verticalGap: { text: text(values.verticalGap), unit },
    },
    counts: {
      rows: { text: text(values.rows) },
      columns: { text: text(values.columns) },
    },
    cornerRadius,
  };
}

export const SHEET_LAYOUT_PRESETS: readonly SheetLayoutPreset[] = [
  {
    id: "avery-5160",
    name: "Avery 5160 — address labels",
    sheet: "Letter",
    description: "30 labels per sheet, 3 across and 10 down.",
    input: presetInput(
      "mm",
      {
        sheetWidth: 215.9,
        sheetHeight: 279.4,
        rows: 10,
        columns: 3,
        labelWidth: 66.675,
        labelHeight: 25.4,
        marginTop: 12.7,
        marginRight: 4.7625,
        marginBottom: 12.7,
        marginLeft: 4.7625,
        horizontalGap: 3.175,
        verticalGap: 0,
      },
      // Published as rounded, without a figure anyone has measured.
      { state: "estimated", value: { text: "1.5", unit: "mm" } },
    ),
  },
  {
    id: "avery-5163",
    name: "Avery 5163 — shipping labels",
    sheet: "Letter",
    description: "10 labels per sheet, 2 across and 5 down.",
    input: presetInput(
      "mm",
      {
        sheetWidth: 215.9,
        sheetHeight: 279.4,
        rows: 5,
        columns: 2,
        labelWidth: 101.6,
        labelHeight: 50.8,
        marginTop: 12.7,
        marginRight: 4.7625,
        marginBottom: 12.7,
        marginLeft: 4.7625,
        horizontalGap: 3.175,
        verticalGap: 0,
      },
      { state: "estimated", value: { text: "1.5", unit: "mm" } },
    ),
  },
  {
    id: "avery-l7160",
    name: "Avery L7160 — address labels",
    sheet: "A4",
    description: "21 labels per sheet, 3 across and 7 down.",
    input: presetInput(
      "mm",
      {
        sheetWidth: 210,
        sheetHeight: 297,
        rows: 7,
        columns: 3,
        labelWidth: 63.5,
        labelHeight: 38.1,
        marginTop: 15.15,
        marginRight: 7.25,
        marginBottom: 15.15,
        marginLeft: 7.25,
        horizontalGap: 2.5,
        verticalGap: 0,
      },
      { state: "known", value: { text: "2", unit: "mm" } },
    ),
  },
  {
    id: "avery-l7651",
    name: "Avery L7651 — mini labels",
    sheet: "A4",
    description: "65 labels per sheet, 5 across and 13 down.",
    input: presetInput(
      "mm",
      {
        sheetWidth: 210,
        sheetHeight: 297,
        rows: 13,
        columns: 5,
        labelWidth: 38.1,
        labelHeight: 21.2,
        marginTop: 10.7,
        marginRight: 4.75,
        marginBottom: 10.7,
        marginLeft: 4.75,
        horizontalGap: 2.5,
        verticalGap: 0,
      },
      // Nobody has measured these corners, which is not the same as square.
      { state: "unknown" },
    ),
  },
  {
    id: "square-craft",
    name: "Square craft labels",
    sheet: "Letter",
    description: "12 square labels per sheet, 3 across and 4 down.",
    input: presetInput(
      "in",
      {
        sheetWidth: 8.5,
        sheetHeight: 11,
        rows: 4,
        columns: 3,
        labelWidth: 2,
        labelHeight: 2,
        marginTop: 1.5,
        marginRight: 0.75,
        marginBottom: 1.5,
        marginLeft: 0.75,
        horizontalGap: 0.5,
        verticalGap: 0,
      },
      { state: "zero" },
    ),
  },
  /*
   * The two TownStix sheets are the catalog's first case of a product whose
   * label size and whose margins do not agree.
   *
   * Both are sold as whole inches — four by two, four by five — and both are
   * laid out with margins that leave slightly more than that. On the US-10, a
   * 12 mm band top and bottom leaves 255.4 mm for five rows, which is 51.08 mm
   * each and not the 50.8 mm two inches would be; the same 0.28 mm a row shows
   * up as 0.45 mm a column across the width.
   *
   * The margins win, because a preset is a layout and not a product name: they
   * are the figures somebody measured, the label size is what those figures
   * leave, and this package exists to say what an entry implies rather than to
   * repeat what a box claims. The nominal size is in the description so the
   * difference is visible rather than quietly resolved.
   */
  {
    id: "townstix-us10",
    name: "TownStix US-10 — shipping labels",
    sheet: "Letter",
    description:
      "10 labels per sheet, 2 across and 5 down. Sold as 4 × 2 in; the sheet's margins leave a shade more.",
    input: presetInput(
      "mm",
      {
        sheetWidth: 215.9,
        sheetHeight: 279.4,
        rows: 5,
        columns: 2,
        // What the margins and gaps leave, not what the box says.
        labelWidth: 102.05,
        labelHeight: 51.08,
        marginTop: 12,
        marginRight: 3.5,
        marginBottom: 12,
        marginLeft: 3.5,
        horizontalGap: 4.8,
        verticalGap: 0,
      },
      // Nobody here has measured the corners, which is not the same as square.
      { state: "unknown" },
    ),
  },
  {
    id: "townstix-us4",
    name: "TownStix US-4 — large labels",
    sheet: "Letter",
    description:
      "4 labels per sheet, 2 across and 2 down. Sold as 4 × 5 in; the sheet's margins leave a shade more.",
    input: presetInput(
      "mm",
      {
        sheetWidth: 215.9,
        sheetHeight: 279.4,
        rows: 2,
        columns: 2,
        labelWidth: 101.95,
        labelHeight: 127.7,
        marginTop: 12,
        marginRight: 4,
        marginBottom: 12,
        marginLeft: 4,
        horizontalGap: 4,
        verticalGap: 0,
      },
      { state: "unknown" },
    ),
  },
];

export function sheetLayoutPreset(id: string): SheetLayoutPreset | undefined {
  return SHEET_LAYOUT_PRESETS.find((preset) => preset.id === id);
}
