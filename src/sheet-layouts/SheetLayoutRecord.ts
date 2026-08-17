/**
 * Durable sheet-layout records.
 *
 * A sheet layout is two things, kept apart on purpose:
 *
 * - a **stable identity** ({@link SheetLayoutRecord}) that a reader can name
 *   and keep referring to, and
 * - an ordered series of **immutable revisions**
 *   ({@link SheetLayoutRevisionRecord}), each holding one complete set of
 *   validated geometry with the disclosures that explain where it came from.
 *
 * A revision is never edited. Correcting a measurement appends revision N + 1
 * and leaves every earlier revision exactly as it was saved, so anything that
 * referenced revision N — a project, a print preparation, a calibration draft —
 * keeps reading the geometry it was prepared against.
 *
 * Only validated geometry can reach these records: the factory takes a
 * {@link ResolvedSheetLayout}, whose branded millimetres no form-state value
 * can satisfy, and re-judges it before building the record.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  COUNT_FIELDS,
  MEASUREMENT_FIELDS,
  type CountFieldId,
  type MeasurementFieldId,
} from "./SheetLayoutInput";
import type { SheetGeometry } from "./SheetGeometry";
import type { MeasurementSourceDisclosure } from "./parseMeasurement";
import type { SheetLayoutDerivation } from "./deriveDimension";
import type { ResolvedSheetLayout } from "./resolveSheetLayout";
import {
  validateSheetGeometry,
  type SheetGeometryRefusal,
} from "./validateSheetGeometry";

/** Bumped whenever a durable sheet-layout record shape changes; carried per record. */
/**
 * 2 since derivation became one value per axis rather than one per sheet.
 * Revisions written under 1 are read through
 * {@link upgradeSheetLayoutRevisionRecord}.
 */
export const SHEET_LAYOUT_SCHEMA_VERSION = 2;

/** The first revision of every layout. Numbering is 1-based and monotonic. */
export const FIRST_REVISION_NUMBER = 1;

/**
 * Stable identity for one sheet layout. It deliberately holds no geometry:
 * every measurement lives in a revision, so the identity can be renamed
 * without any saved geometry changing.
 */
export interface SheetLayoutRecord {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  /**
   * The highest revision number stored. This is a pointer for listing and for
   * offering the next save, never a value to read geometry from: callers that
   * need geometry reference an exact {@link SheetLayoutRevisionRef}.
   */
  latestRevisionNumber: number;
}

import type { SheetLayoutRevisionRef } from "./SheetLayoutRevisionRef";

// Re-exported so existing importers of this module are unaffected by the type
// having moved out to keep the package surface free of persistence code.
export type { SheetLayoutRevisionRef };

/**
 * What was entered for each value, kept beside the normalized geometry.
 *
 * A derived measurement has no entered text and is therefore `null` here — its
 * explanation is the revision's derivation, not an invented source.
 */
export interface SheetLayoutSourceDisclosures {
  measurements: Readonly<
    Record<MeasurementFieldId, MeasurementSourceDisclosure | null>
  >;
  /** Counts have no unit or notation, so the entered integer is the disclosure. */
  counts: Readonly<Record<CountFieldId, number>>;
  /** Null for the zero and unknown radius states, which carry no measurement. */
  cornerRadius: MeasurementSourceDisclosure | null;
}

/**
 * One immutable revision of a layout's geometry.
 *
 * `geometry.cornerRadius` carries the four-state radius disclosure, so a reader
 * can always tell "square corners" from "nobody measured them".
 */
export interface SheetLayoutRevisionRecord {
  layoutId: string;
  revisionNumber: number;
  schemaVersion: number;
  /** When this revision was saved. It is never updated, because the record is never updated. */
  createdAt: number;
  geometry: SheetGeometry;
  sources: SheetLayoutSourceDisclosures;
  /**
   * The derived dimensions and their equations — at most one per axis, and
   * empty when every value was entered.
   *
   * Schema 1 held a single `derivation` here, because derivation was limited to
   * one unknown per sheet. Both axes can now supply a value, so the field is a
   * list; {@link upgradeSheetLayoutRevisionRecord} carries the older shape
   * forward rather than discarding the revision.
   */
  derivations: readonly SheetLayoutDerivation[];
}

/** The schema-1 shape of a revision, kept only so it can be read and upgraded. */
interface LegacySheetLayoutRevisionRecord
  extends Omit<SheetLayoutRevisionRecord, "derivations"> {
  derivation: SheetLayoutDerivation | null;
}

/** A layout identity together with the revision that was just saved. */
export interface SavedSheetLayoutRevision {
  layout: SheetLayoutRecord;
  revision: SheetLayoutRevisionRecord;
}

/**
 * Refusal to save geometry that cannot describe a sheet. It carries the
 * structured refusals so a caller can show the same explanation the form does.
 */
export class SheetLayoutSaveRefusedError extends Error {
  readonly refusals: readonly SheetGeometryRefusal[];

  constructor(refusals: readonly SheetGeometryRefusal[]) {
    super(
      `This sheet layout cannot be saved: ${refusals.map((refusal) => refusal.message).join(" ")}`,
    );
    this.name = "SheetLayoutSaveRefusedError";
    this.refusals = refusals;
  }
}

export function normalizeSheetLayoutName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Sheet layout name cannot be empty.");
  }
  return trimmed;
}

export function createSheetLayoutRecord(
  id: string,
  name: string,
  now: number,
): SheetLayoutRecord {
  return {
    id,
    name: normalizeSheetLayoutName(name),
    schemaVersion: SHEET_LAYOUT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    latestRevisionNumber: FIRST_REVISION_NUMBER,
  };
}

/** The identity with its pointer advanced. The identity is mutable; revisions are not. */
export function withLatestRevision(
  record: SheetLayoutRecord,
  revisionNumber: number,
  now: number,
): SheetLayoutRecord {
  return { ...record, latestRevisionNumber: revisionNumber, updatedAt: now };
}

/** Restates a resolved layout's disclosures in the order the fields are defined. */
function disclosuresOf(
  layout: ResolvedSheetLayout,
): SheetLayoutSourceDisclosures {
  const measurements = {} as Record<
    MeasurementFieldId,
    MeasurementSourceDisclosure | null
  >;
  for (const field of MEASUREMENT_FIELDS) {
    const measurement = layout.measurements[field.id];
    measurements[field.id] =
      measurement.status === "parsed" ? { ...measurement.source } : null;
  }
  const counts = {} as Record<CountFieldId, number>;
  for (const field of COUNT_FIELDS) {
    counts[field.id] = layout.counts[field.id];
  }
  return {
    measurements,
    counts,
    cornerRadius: layout.cornerRadius
      ? { ...layout.cornerRadius.source }
      : null,
  };
}

/** Freezes the record and everything reachable from it, so "immutable" is enforced rather than promised. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

/**
 * Builds one immutable revision from validated geometry.
 *
 * The geometry is judged again here even though the caller has already
 * resolved it: this is the boundary durable records are written at, and a
 * value assembled by hand, restored from an import, or migrated from an older
 * schema must not become a saved revision without passing the same check.
 *
 * @throws SheetLayoutSaveRefusedError when the geometry is refused.
 */
export function createSheetLayoutRevisionRecord(
  ref: SheetLayoutRevisionRef,
  layout: ResolvedSheetLayout,
  now: number,
): SheetLayoutRevisionRecord {
  if (
    !Number.isInteger(ref.revisionNumber) ||
    ref.revisionNumber < FIRST_REVISION_NUMBER
  ) {
    throw new Error(
      `Revision numbers start at ${FIRST_REVISION_NUMBER}, received ${ref.revisionNumber}.`,
    );
  }
  const validation = validateSheetGeometry(layout.geometry);
  if (validation.status === "refused") {
    throw new SheetLayoutSaveRefusedError(validation.refusals);
  }
  return deepFreeze({
    layoutId: ref.layoutId,
    revisionNumber: ref.revisionNumber,
    schemaVersion: SHEET_LAYOUT_SCHEMA_VERSION,
    createdAt: now,
    geometry: structuredClone(layout.geometry),
    sources: disclosuresOf(layout),
    derivations: layout.derivations.map((derivation) =>
      structuredClone(derivation),
    ),
  });
}

/**
 * Reads a revision saved under an older schema.
 *
 * Schema 1 recorded at most one derivation, in a field of its own. That is a
 * list of nothing or a list of one, so the revision is still fully readable and
 * there is no reason to make an operator lose it. Anything else is returned
 * unchanged, and judged by {@link isSheetLayoutRevisionRecord} as before.
 */
export function upgradeSheetLayoutRevisionRecord(value: unknown): unknown {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  const record = value as Partial<LegacySheetLayoutRevisionRecord>;
  if (record.schemaVersion !== 1 || !("derivation" in record)) {
    return value;
  }
  const { derivation, ...rest } = record as LegacySheetLayoutRevisionRecord;
  return {
    ...rest,
    schemaVersion: SHEET_LAYOUT_SCHEMA_VERSION,
    derivations: derivation ? [derivation] : [],
  };
}

/** True when the stored value is a revision this version of the app can read. */
export function isSheetLayoutRevisionRecord(
  value: unknown,
): value is SheetLayoutRevisionRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Partial<SheetLayoutRevisionRecord>;
  return (
    typeof record.layoutId === "string" &&
    record.layoutId.length > 0 &&
    Number.isInteger(record.revisionNumber) &&
    (record.revisionNumber ?? 0) >= FIRST_REVISION_NUMBER &&
    record.schemaVersion === SHEET_LAYOUT_SCHEMA_VERSION &&
    typeof record.createdAt === "number" &&
    Number.isFinite(record.createdAt) &&
    typeof record.geometry === "object" &&
    record.geometry !== null &&
    typeof record.sources === "object" &&
    record.sources !== null &&
    Array.isArray(record.derivations)
  );
}
