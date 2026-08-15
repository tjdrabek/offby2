/**
 * Serializable source input for a sheet layout.
 *
 * Everything here is exactly what the user typed: text plus the unit it was
 * typed in. Nothing is parsed, normalized, or coerced, so an invalid entry can
 * always be shown back for correction. Normalized millimetre geometry is a
 * separate value (see SheetGeometry.ts) that these types cannot satisfy.
 */

/** Units a measurement may be entered in. Millimetres are authoritative only after normalization. */
export type LengthUnit = "mm" | "cm" | "in";

export interface LengthUnitOption {
  unit: LengthUnit;
  /** Spoken/visible name, e.g. for a unit selector. */
  label: string;
  /** Short suffix shown in each field label so the unit is exposed in text. */
  suffix: string;
}

export const LENGTH_UNITS: readonly LengthUnitOption[] = [
  { unit: "mm", label: "Millimetres (mm)", suffix: "mm" },
  { unit: "cm", label: "Centimetres (cm)", suffix: "cm" },
  { unit: "in", label: "Inches (in)", suffix: "in" },
];

export const DEFAULT_LENGTH_UNIT: LengthUnit = "mm";

export function lengthUnitSuffix(unit: LengthUnit): string {
  return LENGTH_UNITS.find((option) => option.unit === unit)?.suffix ?? unit;
}

/** One dimensional entry: the source text plus the unit it is expressed in. */
export interface MeasurementInput {
  text: string;
  unit: LengthUnit;
}

/** One integer entry. Counts have no unit, but still retain their source text. */
export interface CountInput {
  text: string;
}

export type MeasurementFieldId =
  | "sheetWidth"
  | "sheetHeight"
  | "labelWidth"
  | "labelHeight"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "horizontalGap"
  | "verticalGap";

export type CountFieldId = "rows" | "columns";

export type SheetLayoutFieldId =
  MeasurementFieldId | CountFieldId | "cornerRadiusState" | "cornerRadius";

/** Grouping used both for the form's fieldsets and for issue reporting order. */
export type MeasurementGroup = "sheet" | "grid" | "margins" | "gaps";

export interface MeasurementFieldDefinition {
  id: MeasurementFieldId;
  group: MeasurementGroup;
  /** Accessible name, without the unit suffix the form appends. */
  label: string;
}

export const MEASUREMENT_FIELDS: readonly MeasurementFieldDefinition[] = [
  { id: "sheetWidth", group: "sheet", label: "Sheet width" },
  { id: "sheetHeight", group: "sheet", label: "Sheet height" },
  { id: "labelWidth", group: "grid", label: "Label width" },
  { id: "labelHeight", group: "grid", label: "Label height" },
  { id: "marginTop", group: "margins", label: "Top margin" },
  { id: "marginRight", group: "margins", label: "Right margin" },
  { id: "marginBottom", group: "margins", label: "Bottom margin" },
  { id: "marginLeft", group: "margins", label: "Left margin" },
  { id: "horizontalGap", group: "gaps", label: "Horizontal gap" },
  { id: "verticalGap", group: "gaps", label: "Vertical gap" },
];

export function measurementFieldLabel(id: MeasurementFieldId): string {
  return MEASUREMENT_FIELDS.find((field) => field.id === id)?.label ?? id;
}

export interface CountFieldDefinition {
  id: CountFieldId;
  label: string;
}

export const COUNT_FIELDS: readonly CountFieldDefinition[] = [
  { id: "rows", label: "Rows" },
  { id: "columns", label: "Columns" },
];

export function countFieldLabel(id: CountFieldId): string {
  return COUNT_FIELDS.find((field) => field.id === id)?.label ?? id;
}

/**
 * Four-state corner-radius disclosure. This is a discriminated union rather
 * than a nullable number because "unknown" (nobody measured it) is a different
 * claim from "zero" (the labels have square corners).
 */
export type CornerRadiusStateId = "zero" | "known" | "estimated" | "unknown";

export type CornerRadiusInput =
  | { state: "zero" }
  | { state: "known"; value: MeasurementInput }
  | { state: "estimated"; value: MeasurementInput }
  | { state: "unknown" };

export interface CornerRadiusStateOption {
  state: CornerRadiusStateId;
  label: string;
  /** Says what the state claims, so the distinction is never carried by layout alone. */
  description: string;
}

export const CORNER_RADIUS_STATES: readonly CornerRadiusStateOption[] = [
  {
    state: "zero",
    label: "Square corners (radius is zero)",
    description: "The labels have square corners.",
  },
  {
    state: "known",
    label: "Known radius",
    description: "The radius comes from the manufacturer or a measurement.",
  },
  {
    state: "estimated",
    label: "Estimated radius",
    description: "The radius is an approximation and has not been confirmed.",
  },
  {
    state: "unknown",
    label: "Unknown radius",
    description:
      "Nobody has measured the corners. This is not the same as square corners.",
  },
];

/** True when the state carries its own radius measurement. */
export function cornerRadiusNeedsValue(
  state: CornerRadiusStateId,
): state is "known" | "estimated" {
  return state === "known" || state === "estimated";
}

/** The entered radius measurement, or null for the states that carry none. */
export function cornerRadiusValue(
  cornerRadius: CornerRadiusInput,
): MeasurementInput | null {
  return cornerRadius.state === "known" || cornerRadius.state === "estimated"
    ? cornerRadius.value
    : null;
}

/**
 * Complete source input for one uniform-grid sheet layout.
 *
 * Only rectangular sheets carrying a uniform grid of identical square or
 * rounded-rectangle labels are representable: there is no media-type field, no
 * per-label override, and no per-row or per-column dimension.
 */
export interface SheetLayoutSourceInput {
  measurements: Readonly<Record<MeasurementFieldId, MeasurementInput>>;
  counts: Readonly<Record<CountFieldId, CountInput>>;
  cornerRadius: CornerRadiusInput;
}

export function createEmptySheetLayoutInput(
  unit: LengthUnit = DEFAULT_LENGTH_UNIT,
): SheetLayoutSourceInput {
  const measurements = {} as Record<MeasurementFieldId, MeasurementInput>;
  for (const field of MEASUREMENT_FIELDS) {
    measurements[field.id] = { text: "", unit };
  }
  const counts = {} as Record<CountFieldId, CountInput>;
  for (const field of COUNT_FIELDS) {
    counts[field.id] = { text: "" };
  }
  return { measurements, counts, cornerRadius: { state: "zero" } };
}

/** Re-expresses every measurement in a new unit, keeping the source text untouched. */
export function withMeasurementUnit(
  input: SheetLayoutSourceInput,
  unit: LengthUnit,
): SheetLayoutSourceInput {
  const measurements = {} as Record<MeasurementFieldId, MeasurementInput>;
  for (const field of MEASUREMENT_FIELDS) {
    measurements[field.id] = { ...input.measurements[field.id], unit };
  }
  const source = input.cornerRadius;
  const cornerRadius: CornerRadiusInput =
    source.state === "known" || source.state === "estimated"
      ? { state: source.state, value: { ...source.value, unit } }
      : source;
  return { ...input, measurements, cornerRadius };
}

/**
 * Switches the corner-radius state, carrying any already-entered radius text
 * across between the two states that use one.
 */
export function withCornerRadiusState(
  input: SheetLayoutSourceInput,
  state: CornerRadiusStateId,
  unit: LengthUnit,
): SheetLayoutSourceInput {
  if (!cornerRadiusNeedsValue(state)) {
    return { ...input, cornerRadius: { state } };
  }
  const existing = cornerRadiusValue(input.cornerRadius) ?? { text: "", unit };
  return { ...input, cornerRadius: { state, value: existing } };
}
