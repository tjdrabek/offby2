/**
 * offby2 — sheet layouts for label printing.
 *
 * The package answers three questions and refuses to guess at the rest:
 *
 * 1. Is what the operator entered readable? (`validateSheetLayoutInput`)
 * 2. Can the one value they left out be worked out? (`resolveSheetLayout`)
 * 3. Is the sheet they described one that can exist? (`validateSheetGeometry`)
 *
 * `resolveSheetLayout` is the one call most consumers need: it runs all three
 * in the only order that makes sense and returns a single discriminated result.
 *
 * Everything here is pure. No React, no DOM, no storage, no PDF writer — a host
 * application owns presentation and durability, and the operator and their
 * printer own everything physical.
 */

// The entry point most consumers need.
export {
  resolveSheetLayout,
  type DerivedMeasurement,
  type ResolvedMeasurement,
  type ResolvedSheetLayout,
  type SheetLayoutResolution,
} from "./sheet-layouts/resolveSheetLayout";

// What an operator types, and how to start, re-unit, and reshape it.
export {
  COUNT_FIELDS,
  CORNER_RADIUS_STATES,
  DEFAULT_LENGTH_UNIT,
  LENGTH_UNITS,
  MEASUREMENT_FIELDS,
  cornerRadiusNeedsValue,
  cornerRadiusValue,
  countFieldLabel,
  createEmptySheetLayoutInput,
  lengthUnitSuffix,
  measurementFieldLabel,
  withCornerRadiusState,
  withMeasurementUnit,
  type CornerRadiusInput,
  type CornerRadiusStateId,
  type CornerRadiusStateOption,
  type CountFieldDefinition,
  type CountFieldId,
  type CountInput,
  type LengthUnit,
  type LengthUnitOption,
  type MeasurementFieldDefinition,
  type MeasurementFieldId,
  type MeasurementGroup,
  type MeasurementInput,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./sheet-layouts/SheetLayoutInput";

// Normalized geometry: millimetres, branded so a raw number cannot pose as one.
export {
  MAX_GRID_COUNT,
  MIN_GRID_COUNT,
  cornerRadiusMm,
  isGridCount,
  millimetres,
  parseGridCountText,
  type CornerRadiusDisclosure,
  type GridCounts,
  type LabelSize,
  type Millimetres,
  type SheetGaps,
  type SheetGeometry,
  type SheetMargins,
  type SheetSize,
} from "./sheet-layouts/SheetGeometry";

// Units, comparison, and display formatting.
export {
  MEASUREMENT_TOLERANCE_MM,
  MM_PER_CENTIMETRE,
  MM_PER_INCH,
  formatMeasurement,
  formatMillimetres,
  fromMillimetres,
  measurementFrom,
  measurementsEqual,
  millimetresPerUnit,
  toMillimetres,
} from "./sheet-layouts/measurementUnits";

// Reading one entry, for a consumer validating a field as it is typed.
export {
  MAX_FRACTION_TOKEN_DIGITS,
  MAX_MEASUREMENT_MM,
  REQUIRED_MESSAGE,
  parseMeasurement,
  type MeasurementNotation,
  type MeasurementParseErrorCode,
  type MeasurementParseFailure,
  type MeasurementParseResult,
  type MeasurementSourceDisclosure,
  type ParsedMeasurement,
} from "./sheet-layouts/parseMeasurement";

// Field-level validation and its issues.
export {
  issuesByField,
  validateSheetLayoutInput,
  type NormalizedSheetLayout,
  type PartialNormalizedSheetLayout,
  type SheetLayoutInputValidation,
  type SheetLayoutIssue,
  type SheetLayoutIssueCode,
} from "./sheet-layouts/validateSheetLayoutInput";

// Geometry validation, its refusals, and the axis arithmetic behind them.
export {
  axisContentExtent,
  geometryMeasurements,
  geometryRefusalIssues,
  labelTracks,
  validateSheetGeometry,
  type LabelTrack,
  type SheetGeometryRefusal,
  type SheetGeometryRefusalCode,
  type SheetGeometryValidation,
} from "./sheet-layouts/validateSheetGeometry";

// Working out the single dimension an operator left blank.
export {
  AXIS_EQUATIONS,
  COUNT_SINGULAR,
  axisEquationFor,
  axisEquationText,
  deriveMissingDimension,
  deriveMissingDimensions,
  type AxisDerivationResults,
  type AxisEquation,
  type DerivationAxis,
  type DerivationOperand,
  type DerivationRefusalCode,
  type DerivationSkipReason,
  type SheetLayoutDerivation,
  type SheetLayoutDerivationResult,
} from "./sheet-layouts/deriveDimension";

// What this package represents, and — just as importantly — what it does not.
export {
  SUPPORTED_MEDIA_DESCRIPTION,
  SUPPORTED_MEDIA_KIND,
  UNSUPPORTED_MEDIA,
  describeUnsupportedMedia,
  unsupportedMediaMessage,
  type MediaKind,
  type SupportedMediaKind,
  type UnsupportedMediaDescription,
  type UnsupportedMediaKind,
} from "./sheet-layouts/supportedMedia";

// Where each label lands, for a preview, a picker, or a PDF writer.
export {
  labelCount,
  labelPositions,
  safeArea,
  sheetExtent,
  type LabelPosition,
} from "./sheet-layouts/labelPositions";

// Pointing at one exact revision of a layout, which a profile is measured
// against. The records themselves are the host's persistence concern.
export {
  sameRevision,
  type SheetLayoutRevisionRef,
} from "./sheet-layouts/SheetLayoutRevisionRef";

// Calibration: measuring where a printing setup actually puts content, and
// correcting for it. Translation only — see PrinterProfile.ts for why.
export {
  calibrationSheet,
  type CalibrationSheetPlan,
  type CalibrationTarget,
} from "./calibration/calibrationSheet";

export {
  allPhysical,
  distinctSheetCount,
  observationOf,
  type CalibrationObservationSet,
  type ObservationProvenance,
  type TargetObservation,
} from "./calibration/PlacementObservation";

export {
  correctedPoint,
  profileMatchesRevision,
  type PlacementTranslation,
  type PrinterProfile,
  type ProfileEvidence,
} from "./calibration/PrinterProfile";

export {
  PROVISIONAL_CALIBRATION_POLICY,
  derivePrinterProfile,
  type CalibrationPolicy,
  type CalibrationRefusal,
  type CalibrationRefusalCode,
  type DerivePrinterProfileInput,
  type PrinterProfileDerivation,
} from "./calibration/derivePrinterProfile";

// The sheet sizes a consumer printer is normally fed.
export {
  STANDARD_SHEET_SIZES,
  matchStandardSheetSize,
  standardSheetSize,
  type StandardSheetSize,
} from "./sheet-layouts/standardSheetSizes";

// Published figures for common label products, as entries to be validated.
export {
  SHEET_LAYOUT_PRESETS,
  sheetLayoutPreset,
  type SheetLayoutPreset,
} from "./sheet-layouts/presets";

