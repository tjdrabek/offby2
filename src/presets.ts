/**
 * offby2/presets — published figures for common label products, and the
 * sheet sizes a consumer printer is normally fed.
 *
 * Presets are entries to be validated, not trusted geometry: each one is a
 * `SheetLayoutSourceInput` that still goes through `resolveSheetLayout`
 * like anything an operator typed.
 */

export {
  SHEET_LAYOUT_PRESETS,
  sheetLayoutPreset,
  type SheetLayoutPreset,
} from "./sheet-layouts/presets.js";

export {
  STANDARD_SHEET_SIZES,
  matchStandardSheetSize,
  standardSheetSize,
  type StandardSheetSize,
} from "./sheet-layouts/standardSheetSizes.js";
