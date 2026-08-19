/**
 * offby2 — sheet layouts for label printing.
 *
 * The core entry point is one workflow: start an input, resolve it, read the
 * result. `resolveSheetLayout` validates every entry, works out the one value
 * the operator left blank, and refuses geometry that cannot exist — in the
 * only order that makes sense — and returns a single discriminated result.
 *
 * The rest of the package is split by job, so a consumer imports only what
 * they are building:
 *
 * - `offby2/fields` — vocabulary for building an entry form: field
 *   definitions, units, parsing and formatting single entries.
 * - `offby2/calibration` — measuring where a printing setup actually puts
 *   content, and correcting for it.
 * - `offby2/presets` — published figures for common label products and
 *   standard sheet sizes.
 *
 * Everything is pure. No React, no DOM, no storage, no PDF writer — a host
 * application owns presentation and durability, and the operator and their
 * printer own everything physical.
 */

// The workflow: start an input, resolve it.
export {
  createEmptySheetLayoutInput,
  type CornerRadiusInput,
  type CornerRadiusStateId,
  type CountFieldId,
  type CountInput,
  type LengthUnit,
  type MeasurementFieldId,
  type MeasurementInput,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./sheet-layouts/SheetLayoutInput";

export {
  resolveSheetLayout,
  type DerivedMeasurement,
  type ResolvedMeasurement,
  type ResolvedSheetLayout,
  type SheetLayoutResolution,
} from "./sheet-layouts/resolveSheetLayout";

// Reading an unresolved or refused result back onto the fields it came from.
export {
  issuesByField,
  type SheetLayoutIssue,
  type SheetLayoutIssueCode,
} from "./sheet-layouts/validateSheetLayoutInput";

export {
  geometryRefusalIssues,
  type SheetGeometryRefusal,
  type SheetGeometryRefusalCode,
} from "./sheet-layouts/validateSheetGeometry";

// Normalized geometry: millimetres, branded so a raw number cannot pose as one.
export {
  cornerRadiusMm,
  millimetres,
  type CornerRadiusDisclosure,
  type GridCounts,
  type LabelSize,
  type Millimetres,
  type SheetGaps,
  type SheetGeometry,
  type SheetMargins,
  type SheetSize,
} from "./sheet-layouts/SheetGeometry";

// Where each label lands, for a preview, a picker, or a PDF writer.
export {
  labelCount,
  labelPositions,
  safeArea,
  sheetExtent,
  type LabelPosition,
} from "./sheet-layouts/labelPositions";

// Where content stops on a label: each hold-in is a line, and content stops
// at whichever sits furthest in, per axis.
export {
  contentBoundary,
  type ContentBoundary,
  type DesignFrame,
  type FrameDistancesMm,
  type HoldInAxes,
  type HoldInLine,
} from "./sheet-layouts/contentBoundary";

// The same boundary as percentages of the frame, for proportional renderers.
export {
  contentBoundaryPercents,
  type ContentBoundaryPercents,
  type FramePercents,
} from "./sheet-layouts/contentBoundaryPercents";

// Whether rendered content agrees with the boundary: plain numbers from a
// readback in, a judgement out. `offby2/web` gathers the numbers.
export {
  AGREES,
  SUBPIXEL_TOLERANCE_PX,
  judgeBoundaryAgreement,
  onScreenEdges,
  type BoundaryAgreement,
  type BoundaryReadback,
  type EdgesPx,
} from "./sheet-layouts/boundaryAgreement";

// Pointing at one exact revision of a layout, which a profile is measured
// against. The records themselves are the host's persistence concern.
export {
  sameRevision,
  type SheetLayoutRevisionRef,
} from "./sheet-layouts/SheetLayoutRevisionRef";

// What this package represents, and — just as importantly — what it does not.
export {
  UNSUPPORTED_MEDIA,
  type MediaKind,
  type SupportedMediaKind,
  type UnsupportedMediaDescription,
  type UnsupportedMediaKind,
} from "./sheet-layouts/supportedMedia";
