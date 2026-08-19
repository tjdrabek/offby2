/**
 * Judges normalized millimetre geometry and refuses everything it cannot
 * describe, without coercing, clamping, or quietly adjusting a single value.
 *
 * Sheet coordinates are documented once here and used everywhere: the origin
 * is the top-left corner of the sheet, x increases to the right, y increases
 * downwards, and every value is millimetres. A label occupies the closed
 * interval [start, end] on each axis, and the sheet occupies [0, extent].
 *
 * Every refusal carries a stable code, the fields a reader can act on, and a
 * message stating the measured conflict rather than a generic complaint. The
 * checks run in phases — media, numeric, counts, per-axis geometry, radius —
 * and a later phase is skipped for values an earlier one already refused, so a
 * consequence is never reported as if it were an independent problem. Each
 * axis yields at most one geometric refusal, in the order overlap, out of
 * sheet, contradictory total, because the first is the most concrete
 * description of the same conflict.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  AXIS_EQUATIONS,
  COUNT_SINGULAR,
  axisEquationText,
  type AxisEquation,
} from "./deriveDimension.js";
import {
  MEASUREMENT_TOLERANCE_MM,
  formatMillimetres,
} from "./measurementUnits.js";
import {
  MAX_GRID_COUNT,
  MIN_GRID_COUNT,
  cornerRadiusMm,
  isGridCount,
  millimetres,
  type SheetGeometry,
} from "./SheetGeometry.js";
import {
  COUNT_FIELDS,
  measurementFieldLabel,
  type CountFieldId,
  type MeasurementFieldId,
  type SheetLayoutFieldId,
} from "./SheetLayoutInput.js";
import {
  SUPPORTED_MEDIA_KIND,
  describeUnsupportedMedia,
  unsupportedMediaMessage,
} from "./supportedMedia.js";
import type { SheetLayoutIssue } from "./validateSheetLayoutInput.js";

export type SheetGeometryRefusalCode =
  | "geometry-unsupported-media"
  | "geometry-not-finite"
  | "geometry-negative"
  | "geometry-not-positive"
  | "geometry-count-unusable"
  | "geometry-gap-single-count"
  | "geometry-labels-overlap"
  | "geometry-labels-outside-sheet"
  | "geometry-extent-contradiction"
  | "geometry-radius-exceeds-label";

export interface SheetGeometryRefusal {
  code: SheetGeometryRefusalCode;
  /** Every field a reader could change to resolve it; the first is the primary one. */
  fields: readonly SheetLayoutFieldId[];
  message: string;
}

export type SheetGeometryValidation =
  | { status: "valid" }
  | { status: "refused"; refusals: readonly SheetGeometryRefusal[] };

/** One label's boundaries along a single axis, in sheet coordinates. */
export interface LabelTrack {
  /** Zero-based position along the axis. */
  index: number;
  startMm: number;
  endMm: number;
}

/** Sheet dimensions and label dimensions must be greater than zero. */
const POSITIVE_FIELDS: readonly MeasurementFieldId[] = [
  "sheetWidth",
  "sheetHeight",
  "labelWidth",
  "labelHeight",
];

/**
 * Margins may be zero but never negative. Gaps are absent here on purpose: a
 * negative gap is refused as the label overlap it produces, which says more
 * than its sign does.
 */
const NON_NEGATIVE_FIELDS: readonly MeasurementFieldId[] = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
];

/**
 * Comparison epsilon, scaled by the extent being compared against.
 *
 * It exists for one narrow reason: unit conversion leaves binary dust, so
 * 8.5 in and 215.9 mm differ in the fourteenth decimal place. At sheet scale
 * this bound stays below a nanometre, far under any measurable difference, so
 * it can never excuse geometry that is visibly contradictory.
 */
function toleranceFor(extentMm: number): number {
  return MEASUREMENT_TOLERANCE_MM * Math.max(1, Math.abs(extentMm));
}

/** "63.5 mm", for a value already known to be finite. */
function mm(value: number): string {
  // Full precision, not display precision: these figures appear in refusals
  // whose arithmetic the reader is invited to check, and a bound like
  // "19.05 mm or less" rounded to 19.1 would invite a value that gets refused.
  return `${formatMillimetres(millimetres(value), "mm", 4)} mm`;
}

/** Every dimensional value of a geometry, keyed by the field that carries it. */
export function geometryMeasurements(
  geometry: SheetGeometry,
): Record<MeasurementFieldId, number> {
  return {
    sheetWidth: geometry.sheet.widthMm,
    sheetHeight: geometry.sheet.heightMm,
    labelWidth: geometry.label.widthMm,
    labelHeight: geometry.label.heightMm,
    marginTop: geometry.margins.topMm,
    marginRight: geometry.margins.rightMm,
    marginBottom: geometry.margins.bottomMm,
    marginLeft: geometry.margins.leftMm,
    horizontalGap: geometry.gaps.horizontalMm,
    verticalGap: geometry.gaps.verticalMm,
  };
}

/**
 * The boundary of every label along one axis, from the leading margin outwards
 * at a uniform pitch of `sizeMm + gapMm`.
 */
export function labelTracks(
  leadingMm: number,
  sizeMm: number,
  gapMm: number,
  count: number,
): LabelTrack[] {
  const tracks: LabelTrack[] = [];
  for (let index = 0; index < count; index += 1) {
    const startMm = leadingMm + index * (sizeMm + gapMm);
    tracks.push({ index, startMm, endMm: startMm + sizeMm });
  }
  return tracks;
}

/** The extent the entered parts of one axis add up to. */
export function axisContentExtent(
  leadingMm: number,
  sizeMm: number,
  gapMm: number,
  trailingMm: number,
  count: number,
): number {
  return leadingMm + count * sizeMm + (count - 1) * gapMm + trailingMm;
}

function refusal(
  code: SheetGeometryRefusalCode,
  fields: readonly SheetLayoutFieldId[],
  message: string,
): SheetGeometryRefusal {
  return { code, fields, message };
}

/** Refuses non-finite, non-positive, and negative values, each against its own field. */
function checkMeasurements(
  values: Record<MeasurementFieldId, number>,
  refusals: SheetGeometryRefusal[],
): Set<MeasurementFieldId> {
  const refused = new Set<MeasurementFieldId>();
  for (const [field, value] of Object.entries(values) as [
    MeasurementFieldId,
    number,
  ][]) {
    const label = measurementFieldLabel(field);
    if (!Number.isFinite(value)) {
      refusals.push(
        refusal(
          "geometry-not-finite",
          [field],
          `${label} is not a finite measurement (received ${String(value)}), so this sheet cannot be described.`,
        ),
      );
      refused.add(field);
      continue;
    }
    if (POSITIVE_FIELDS.includes(field) && value <= 0) {
      refusals.push(
        refusal(
          "geometry-not-positive",
          [field],
          `${label} is ${mm(value)}. It must be greater than zero.`,
        ),
      );
      refused.add(field);
      continue;
    }
    if (NON_NEGATIVE_FIELDS.includes(field) && value < 0) {
      refusals.push(
        refusal(
          "geometry-negative",
          [field],
          `${label} is ${mm(value)}. A margin cannot be negative.`,
        ),
      );
      refused.add(field);
    }
  }
  return refused;
}

function checkCounts(
  geometry: SheetGeometry,
  refusals: SheetGeometryRefusal[],
): Set<CountFieldId> {
  const refused = new Set<CountFieldId>();
  for (const field of COUNT_FIELDS) {
    const value = geometry.grid[field.id];
    if (!isGridCount(value)) {
      refusals.push(
        refusal(
          "geometry-count-unusable",
          [field.id],
          `${field.label} is ${String(value)}. It must be a whole number between ${MIN_GRID_COUNT} and ${MAX_GRID_COUNT}.`,
        ),
      );
      refused.add(field.id);
    }
  }
  return refused;
}

/** The five dimensional fields the axis equation relates, extent first. */
function axisMeasurementFields(equation: AxisEquation): MeasurementFieldId[] {
  return [
    equation.extent,
    equation.leading,
    equation.size,
    equation.gap,
    equation.trailing,
  ];
}

/** The fields of one axis, extent first, so a refusal names them in reading order. */
function axisFields(equation: AxisEquation): SheetLayoutFieldId[] {
  return [...axisMeasurementFields(equation), equation.count];
}

/**
 * Checks one axis against its own extent: overlapping labels first, then any
 * boundary outside the sheet, then a total that contradicts the extent.
 */
function checkAxis(
  equation: AxisEquation,
  values: Record<MeasurementFieldId, number>,
  count: number,
): SheetGeometryRefusal | null {
  const extent = values[equation.extent];
  const leading = values[equation.leading];
  const size = values[equation.size];
  const gap = values[equation.gap];
  const trailing = values[equation.trailing];
  const tolerance = toleranceFor(extent);
  const fields = axisFields(equation);
  const noun = COUNT_SINGULAR[equation.count];
  const tracks = labelTracks(leading, size, gap, count);

  // A single row or column leaves no gap on the axis at all, so a nonzero
  // value describes a distance the sheet does not contain — and the equation,
  // in which the term carries a zero coefficient, could never catch it.
  if (count === 1 && Math.abs(gap) > tolerance) {
    return refusal(
      "geometry-gap-single-count",
      [equation.gap, equation.count],
      `${measurementFieldLabel(equation.gap)} is ${mm(gap)}, but with a single ${noun} there is no gap between labels on this axis. Enter 0, or leave it blank and it is derived as 0.`,
    );
  }

  for (let index = 0; index + 1 < tracks.length; index += 1) {
    const overlap = tracks[index].endMm - tracks[index + 1].startMm;
    if (overlap > tolerance) {
      return refusal(
        "geometry-labels-overlap",
        [equation.gap, equation.size, equation.count],
        `${measurementFieldLabel(equation.gap)} is ${mm(gap)}, so ${noun} ${index + 2} would overlap ${noun} ${index + 1} by ${mm(overlap)}. Labels on a uniform grid cannot overlap.`,
      );
    }
  }

  const outside = tracks.find(
    (track) => track.startMm < -tolerance || track.endMm > extent + tolerance,
  );
  if (outside) {
    return refusal(
      "geometry-labels-outside-sheet",
      fields,
      [
        `The grid does not fit the sheet: ${noun} ${outside.index + 1} runs from ${mm(outside.startMm)} to ${mm(outside.endMm)}`,
        `and ${measurementFieldLabel(equation.extent)} is ${mm(extent)}.`,
        "Every label boundary must lie within the sheet.",
      ].join(" "),
    );
  }

  const content = axisContentExtent(leading, size, gap, trailing, count);
  if (Math.abs(content - extent) > tolerance) {
    return refusal(
      "geometry-extent-contradiction",
      fields,
      [
        `The ${equation.axis} measurements add up to ${mm(content)}, but ${measurementFieldLabel(equation.extent)} is ${mm(extent)}`,
        `(${axisEquationText(equation)}).`,
        "Correct one of these values, or clear one and let it be derived.",
      ].join(" "),
    );
  }

  return null;
}

/**
 * Refuses a radius larger than half the shorter label side. An unknown radius
 * makes no claim to check, and is left as the disclosure it is.
 */
function checkCornerRadius(
  geometry: SheetGeometry,
  refusedMeasurements: ReadonlySet<MeasurementFieldId>,
  refusals: SheetGeometryRefusal[],
): void {
  const radius = cornerRadiusMm(geometry.cornerRadius);
  if (radius === null) {
    return;
  }
  if (!Number.isFinite(radius)) {
    refusals.push(
      refusal(
        "geometry-not-finite",
        ["cornerRadius"],
        `Corner radius is not a finite measurement (received ${String(radius)}), so this sheet cannot be described.`,
      ),
    );
    return;
  }
  if (radius < 0) {
    refusals.push(
      refusal(
        "geometry-negative",
        ["cornerRadius"],
        `Corner radius is ${mm(radius)}. A radius cannot be negative.`,
      ),
    );
    return;
  }
  if (
    refusedMeasurements.has("labelWidth") ||
    refusedMeasurements.has("labelHeight")
  ) {
    return;
  }
  const width = geometry.label.widthMm;
  const height = geometry.label.heightMm;
  const limit = Math.min(width, height) / 2;
  if (radius > limit + toleranceFor(limit)) {
    refusals.push(
      refusal(
        "geometry-radius-exceeds-label",
        ["cornerRadius", "labelWidth", "labelHeight"],
        `Corner radius is ${mm(radius)}, which is more than half the shorter side of a ${mm(width)} by ${mm(height)} label. Enter ${mm(limit)} or less.`,
      ),
    );
  }
}

/**
 * Validates normalized geometry, returning every refusal that stands on its
 * own. `media` defaults to the one supported kind: callers holding a value
 * from catalog data or an imported workspace pass it so unsupported media is
 * refused explicitly rather than assumed to be a uniform grid.
 */
export function validateSheetGeometry(
  geometry: SheetGeometry,
  media: string = SUPPORTED_MEDIA_KIND,
): SheetGeometryValidation {
  const unsupported = describeUnsupportedMedia(media);
  if (unsupported) {
    // Nothing measured about unsupported media is worth reporting: the shape
    // this validator checks is not the shape the media has.
    return {
      status: "refused",
      refusals: [
        refusal(
          "geometry-unsupported-media",
          [],
          unsupportedMediaMessage(unsupported),
        ),
      ],
    };
  }

  const refusals: SheetGeometryRefusal[] = [];
  const values = geometryMeasurements(geometry);
  const refusedMeasurements = checkMeasurements(values, refusals);
  const refusedCounts = checkCounts(geometry, refusals);

  for (const equation of AXIS_EQUATIONS) {
    // A contradiction computed from a value that was already refused is a
    // consequence, not a second problem, so the axis waits for the correction.
    const unusable =
      refusedCounts.has(equation.count) ||
      axisMeasurementFields(equation).some((field) =>
        refusedMeasurements.has(field),
      );
    if (unusable) {
      continue;
    }
    const axisRefusal = checkAxis(
      equation,
      values,
      geometry.grid[equation.count],
    );
    if (axisRefusal) {
      refusals.push(axisRefusal);
    }
  }

  checkCornerRadius(geometry, refusedMeasurements, refusals);

  return refusals.length > 0
    ? { status: "refused", refusals }
    : { status: "valid" };
}

/**
 * Attaches each refusal to every field it names, so a form can associate it
 * with the controls a reader would change. A refusal with no field — media
 * that is not a sheet at all — belongs to the summary alone.
 */
export function geometryRefusalIssues(
  refusals: readonly SheetGeometryRefusal[],
): SheetLayoutIssue[] {
  return refusals.flatMap((entry) =>
    entry.fields.map((field) => ({
      field,
      code: entry.code,
      // Geometry refusals are not composed from parts (see refusalMessage.ts);
      // the whole sentence is the explanation, with nothing to filter.
      explanation: entry.message,
      remedies: [],
      message: entry.message,
    })),
  );
}
