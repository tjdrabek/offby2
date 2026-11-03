/**
 * The sheet as entered so far, for a drawing that does not wait.
 *
 * `resolveSheetLayout` answers one question — is this a sheet, and which one —
 * and until every entry is in it answers no. A form that draws the paper
 * beside the fields needs a different answer: what is known *now*. The paper
 * alone is drawable the moment its two extents parse; each margin shades its
 * strip as it is typed; and because the two axis equations share no term, an
 * axis whose entries are all in lays its labels out before the other axis has
 * a count.
 *
 * Every number here comes from the same readers the resolver uses — one
 * parser, one derivation, one judgement per axis — so what the sketch draws
 * is never a second opinion about the geometry. When everything is in, the
 * sketch carries the resolved geometry too, and it is the resolver's.
 *
 * An axis is one of three things: laid out, with its five distances and its
 * count; incomplete, naming the fields still blank or unreadable; or refused,
 * naming the fields a reader could change and saying why, in the unit the
 * sheet was entered in. A refusal lists every field on its axis, because the
 * reason a derived label width comes out negative is somewhere among the
 * others, and the drawing's job is to light that axis rather than to guess.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  AXIS_EQUATIONS,
  deriveOnAxis,
  readCount,
  readMeasurements,
  type AxisEquation,
  type DerivationAxis,
  type DerivationRefusalCode,
  type MeasurementEntries,
} from "./deriveDimension.js";
import {
  millimetres,
  type CornerRadiusDisclosure,
  type Millimetres,
  type SheetGeometry,
} from "./SheetGeometry.js";
import {
  type LengthUnit,
  type MeasurementFieldId,
  type SheetLayoutFieldId,
  type SheetLayoutSourceInput,
} from "./SheetLayoutInput.js";
import { parseMeasurement } from "./parseMeasurement.js";
import { entryUnitOf, resolveSheetLayout } from "./resolveSheetLayout.js";
import {
  judgeAxis,
  type SheetGeometryRefusalCode,
} from "./validateSheetGeometry.js";

/** One axis of the grid, fully known: the five distances its equation relates. */
export interface AxisLayout {
  axis: DerivationAxis;
  extentMm: Millimetres;
  leadingMm: Millimetres;
  sizeMm: Millimetres;
  gapMm: Millimetres;
  trailingMm: Millimetres;
  count: number;
  /** The one dimension worked out rather than entered, when there was one. */
  derived: MeasurementFieldId | null;
}

export type AxisSketch =
  | { status: "laid-out"; axis: DerivationAxis; layout: AxisLayout }
  | {
      status: "incomplete";
      axis: DerivationAxis;
      /** The fields still blank or unreadable on this axis, in reading order. */
      missing: readonly SheetLayoutFieldId[];
    }
  | {
      status: "refused";
      axis: DerivationAxis;
      code: DerivationRefusalCode | SheetGeometryRefusalCode;
      /** Every field a reader could change; the first is the primary one. */
      fields: readonly SheetLayoutFieldId[];
      /** In the unit the sheet was entered in. */
      message: string;
    };

/** Whatever the entries describe so far. A null is a value not yet known. */
export interface SheetSketch {
  sheet: { widthMm: Millimetres | null; heightMm: Millimetres | null };
  margins: {
    topMm: Millimetres | null;
    rightMm: Millimetres | null;
    bottomMm: Millimetres | null;
    leftMm: Millimetres | null;
  };
  gaps: { horizontalMm: Millimetres | null; verticalMm: Millimetres | null };
  grid: { rows: number | null; columns: number | null };
  /** Null while a state that needs a radius has none that parses. */
  cornerRadius: CornerRadiusDisclosure | null;
  horizontal: AxisSketch;
  vertical: AxisSketch;
  /** The resolver's own answer, present exactly when it resolves. */
  geometry: SheetGeometry | null;
}

function known(
  entries: MeasurementEntries,
  field: MeasurementFieldId,
): Millimetres | null {
  const value = entries.parsed.get(field);
  return value === undefined ? null : millimetres(value);
}

/** The fields of one axis, extent first, so a refusal names them in reading order. */
function axisFields(equation: AxisEquation): SheetLayoutFieldId[] {
  return [...axisTerms(equation), equation.count];
}

function axisTerms(equation: AxisEquation): MeasurementFieldId[] {
  return [
    equation.extent,
    equation.leading,
    equation.size,
    equation.gap,
    equation.trailing,
  ];
}

function sketchAxis(
  equation: AxisEquation,
  entries: MeasurementEntries,
  count: number | null,
  unit: LengthUnit,
): AxisSketch {
  const { axis } = equation;
  const terms = axisTerms(equation);
  const absent = terms.filter((field) => !entries.parsed.has(field));
  const blank = absent.filter((field) => entries.missing.includes(field));
  const unreadable = absent.filter((field) => !entries.missing.includes(field));

  // One blank per axis is one unknown per equation and solvable; anything
  // more — two blanks, an entry that will not read, no count — is an axis
  // still being entered, and the drawing waits for it.
  if (count === null || unreadable.length > 0 || blank.length > 1) {
    const missing: SheetLayoutFieldId[] = [...absent];
    if (count === null) {
      missing.push(equation.count);
    }
    return { status: "incomplete", axis, missing };
  }

  const values: Partial<Record<MeasurementFieldId, number>> = {};
  for (const field of terms) {
    const value = entries.parsed.get(field);
    if (value !== undefined) {
      values[field] = value;
    }
  }

  let derived: MeasurementFieldId | null = null;
  if (blank.length === 1) {
    const result = deriveOnAxis(equation, entries, count);
    if (result.status === "refused") {
      return {
        status: "refused",
        axis,
        code: result.code,
        fields: [
          result.field,
          ...axisFields(equation).filter((field) => field !== result.field),
        ],
        message: result.message,
      };
    }
    if (result.status !== "derived") {
      return { status: "incomplete", axis, missing: blank };
    }
    values[result.derivation.field] = result.derivation.valueMm;
    derived = result.derivation.field;
  }

  const refusal = judgeAxis(equation, values, count, unit);
  if (refusal) {
    return {
      status: "refused",
      axis,
      code: refusal.code,
      fields: refusal.fields,
      message: refusal.message,
    };
  }

  const at = (field: MeasurementFieldId): Millimetres =>
    millimetres(values[field] ?? Number.NaN);
  return {
    status: "laid-out",
    axis,
    layout: {
      axis,
      extentMm: at(equation.extent),
      leadingMm: at(equation.leading),
      sizeMm: at(equation.size),
      gapMm: at(equation.gap),
      trailingMm: at(equation.trailing),
      count,
      derived,
    },
  };
}

/** The disclosure the corners make so far; null while a needed radius is absent. */
function sketchCornerRadius(
  input: SheetLayoutSourceInput,
): CornerRadiusDisclosure | null {
  const entered = input.cornerRadius;
  if (entered.state === "zero" || entered.state === "unknown") {
    return { state: entered.state };
  }
  const parsed = parseMeasurement("cornerRadius", entered.value);
  return parsed.status === "parsed"
    ? { state: entered.state, radiusMm: parsed.valueMm }
    : null;
}

function equationFor(axis: DerivationAxis): AxisEquation {
  const equation = AXIS_EQUATIONS.find((candidate) => candidate.axis === axis);
  if (!equation) {
    throw new Error(`No axis equation for ${axis}.`);
  }
  return equation;
}

/**
 * Reads whatever the entries describe so far, and lays out each axis the
 * moment it can.
 */
export function sketchSheetLayout(input: SheetLayoutSourceInput): SheetSketch {
  const entries = readMeasurements(input);
  const unit = entryUnitOf(input);
  const rows = readCount(input, "rows");
  const columns = readCount(input, "columns");
  const resolution = resolveSheetLayout(input);

  return {
    sheet: {
      widthMm: known(entries, "sheetWidth"),
      heightMm: known(entries, "sheetHeight"),
    },
    margins: {
      topMm: known(entries, "marginTop"),
      rightMm: known(entries, "marginRight"),
      bottomMm: known(entries, "marginBottom"),
      leftMm: known(entries, "marginLeft"),
    },
    gaps: {
      horizontalMm: known(entries, "horizontalGap"),
      verticalMm: known(entries, "verticalGap"),
    },
    grid: { rows, columns },
    cornerRadius: sketchCornerRadius(input),
    horizontal: sketchAxis(equationFor("horizontal"), entries, columns, unit),
    vertical: sketchAxis(equationFor("vertical"), entries, rows, unit),
    geometry:
      resolution.status === "resolved" ? resolution.layout.geometry : null,
  };
}
