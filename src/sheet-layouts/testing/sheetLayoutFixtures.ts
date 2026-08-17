import {
  MEASUREMENT_FIELDS,
  createEmptySheetLayoutInput,
  type MeasurementFieldId,
  type SheetLayoutSourceInput,
} from "../SheetLayoutInput";
import {
  resolveSheetLayout,
  type ResolvedSheetLayout,
} from "../resolveSheetLayout";
import { millimetres } from "../SheetGeometry";

/** Horizontal: 210 = 10 + 3 × 60 + 2 × 5 + 10. Vertical: 297 = 9.5 + 7 × 38 + 6 × 2 + 9.5. */
export const CONSISTENT_SHEET: Record<MeasurementFieldId, string> = {
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

export function sheetLayoutInput(
  overrides: Partial<Record<MeasurementFieldId, string>> = {},
  counts: { rows?: string; columns?: string } = {},
): SheetLayoutSourceInput {
  const input = createEmptySheetLayoutInput("mm");
  const measurements = { ...input.measurements };
  for (const field of MEASUREMENT_FIELDS) {
    measurements[field.id] = {
      unit: "mm",
      text: overrides[field.id] ?? CONSISTENT_SHEET[field.id],
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

/** A layout the form would accept. Throws rather than returning something unresolved. */
export function resolvedSheetLayout(
  overrides: Partial<Record<MeasurementFieldId, string>> = {},
  counts: { rows?: string; columns?: string } = {},
): ResolvedSheetLayout {
  const resolution = resolveSheetLayout(sheetLayoutInput(overrides, counts));
  if (resolution.status !== "resolved") {
    throw new Error(`Fixture did not resolve: ${resolution.status}`);
  }
  return resolution.layout;
}

/**
 * A resolved layout whose geometry no longer describes a sheet.
 *
 * It is assembled by widening the sheet after resolution, which is exactly the
 * shape a hand-built, imported, or migrated value could take: it satisfies
 * every type the save API asks for, and only re-judging the geometry catches it.
 */
export function contradictorySheetLayout(): ResolvedSheetLayout {
  const layout = resolvedSheetLayout();
  return {
    ...layout,
    geometry: {
      ...layout.geometry,
      sheet: { ...layout.geometry.sheet, widthMm: millimetres(300) },
    },
  };
}
