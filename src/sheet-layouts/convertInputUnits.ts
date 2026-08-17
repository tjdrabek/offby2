/**
 * Re-expressing an entire source input in a new unit, converting the values
 * rather than merely re-labelling them.
 *
 * `withMeasurementUnit` deliberately keeps the source text untouched — it is
 * for a form whose operator is switching which unit they are typing in. This
 * module is the other behaviour: the same sheet, shown in a different unit.
 */

import { losslessMeasurementText } from "./measurementUnits";
import { parseMeasurement } from "./parseMeasurement";
import {
  MEASUREMENT_FIELDS,
  cornerRadiusValue,
  withMeasurementUnit,
  type CornerRadiusInput,
  type LengthUnit,
  type MeasurementFieldId,
  type MeasurementInput,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput";

/**
 * Rewrites one entry in a new unit, keeping the value the operator meant.
 *
 * An entry that does not parse is left as typed and simply re-labelled, so
 * switching units never quietly discards text that is still being corrected.
 */
function convertEntry(
  field: SheetLayoutFieldId,
  entry: MeasurementInput,
  to: LengthUnit,
): MeasurementInput {
  const parsed = parseMeasurement(field, entry);
  if (parsed.status !== "parsed") {
    return { ...entry, unit: to };
  }
  return { text: losslessMeasurementText(parsed.valueMm, to), unit: to };
}

function convertCornerRadius(
  cornerRadius: CornerRadiusInput,
  to: LengthUnit,
): CornerRadiusInput {
  const entered = cornerRadiusValue(cornerRadius);
  if (!entered) {
    return cornerRadius;
  }
  // Only the two states that carry a measurement reach here, and both keep
  // their state across the conversion.
  return {
    state: cornerRadius.state as "known" | "estimated",
    value: convertEntry("cornerRadius", entered, to),
  };
}

/**
 * Re-expresses every entry in `to`, converting each readable value to the
 * shortest text that still means the same measurement. Unreadable entries
 * keep their text and are only re-labelled.
 */
export function convertInputUnits(
  input: SheetLayoutSourceInput,
  to: LengthUnit,
): SheetLayoutSourceInput {
  const measurements = {} as Record<MeasurementFieldId, MeasurementInput>;
  for (const field of MEASUREMENT_FIELDS) {
    measurements[field.id] = convertEntry(
      field.id,
      input.measurements[field.id],
      to,
    );
  }
  return {
    ...withMeasurementUnit(input, to),
    measurements,
    cornerRadius: convertCornerRadius(input.cornerRadius, to),
  };
}
