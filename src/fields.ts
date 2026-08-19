/**
 * offby2/fields — vocabulary for building an entry form.
 *
 * Everything a host needs to render fields for a `SheetLayoutSourceInput`
 * and keep single entries honest as they are typed: field definitions and
 * labels, the unit list, four-state corner-radius disclosure, parsing one
 * entry, formatting a normalized value back for display, and re-expressing
 * a whole input in a different unit without changing what it means.
 */

// The fields themselves: what to render, in what group, with what label.
export {
  COUNT_FIELDS,
  MEASUREMENT_FIELDS,
  countFieldLabel,
  measurementFieldLabel,
  type CountFieldDefinition,
  type MeasurementFieldDefinition,
  type MeasurementGroup,
} from "./sheet-layouts/SheetLayoutInput.js";

// Units, and switching an input between them.
export {
  DEFAULT_LENGTH_UNIT,
  LENGTH_UNITS,
  lengthUnitSuffix,
  withMeasurementUnit,
  type LengthUnitOption,
} from "./sheet-layouts/SheetLayoutInput.js";

// Converting the values, not just the label: the same sheet in a new unit.
export { convertInputUnits } from "./sheet-layouts/convertInputUnits.js";

// Corner radius: a four-state disclosure, not a nullable number.
export {
  CORNER_RADIUS_STATES,
  cornerRadiusNeedsValue,
  cornerRadiusValue,
  withCornerRadiusState,
  type CornerRadiusStateOption,
} from "./sheet-layouts/SheetLayoutInput.js";

// Reading one entry, for validating a field as it is typed.
export {
  parseMeasurement,
  type MeasurementNotation,
  type MeasurementParseErrorCode,
  type MeasurementParseFailure,
  type MeasurementParseResult,
  type MeasurementSourceDisclosure,
  type ParsedMeasurement,
} from "./sheet-layouts/parseMeasurement.js";

// Grid counts: reading and bounding the integer entries.
export {
  MAX_GRID_COUNT,
  MIN_GRID_COUNT,
  isGridCount,
  parseGridCountText,
} from "./sheet-layouts/SheetGeometry.js";

// Showing a normalized value back to the operator.
export {
  formatMeasurement,
  formatMillimetres,
  fromMillimetres,
  losslessMeasurementText,
  measurementsEqual,
  roundedMeasurementText,
} from "./sheet-layouts/measurementUnits.js";
