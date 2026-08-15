/**
 * Normalized sheet geometry.
 *
 * This is the validated, millimetre-based counterpart of the source input in
 * SheetLayoutInput.ts. Every length is a branded {@link Millimetres}, so a raw
 * number — and certainly a user-entered string — cannot be passed off as
 * normalized geometry; the only way to obtain one is {@link millimetres},
 * which refuses anything non-finite.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

declare const millimetresBrand: unique symbol;

/** A finite length in millimetres. Millimetres are authoritative for all domain geometry. */
export type Millimetres = number & { readonly [millimetresBrand]: "mm" };

/**
 * Brands a finite number as millimetres.
 *
 * Only finiteness is enforced here. Domain refusals — negative lengths,
 * overlapping labels, a radius larger than half the label — belong to geometry
 * validation, not to the unit itself.
 */
export function millimetres(value: number): Millimetres {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected a finite millimetre value, received ${value}.`);
  }
  return value as Millimetres;
}

/** Bounded positive integer count of labels along one axis. */
export const MIN_GRID_COUNT = 1;
/** Bounded so a mistyped count cannot ask for unbounded preview or pagination work. */
export const MAX_GRID_COUNT = 1000;

export interface SheetSize {
  widthMm: Millimetres;
  heightMm: Millimetres;
}

export interface LabelSize {
  widthMm: Millimetres;
  heightMm: Millimetres;
}

/** Uniform grid: every label is identical, so counts alone describe the arrangement. */
export interface GridCounts {
  rows: number;
  columns: number;
}

/** All four margins are independent; sheets are not assumed to be symmetric. */
export interface SheetMargins {
  topMm: Millimetres;
  rightMm: Millimetres;
  bottomMm: Millimetres;
  leftMm: Millimetres;
}

export interface SheetGaps {
  horizontalMm: Millimetres;
  verticalMm: Millimetres;
}

/**
 * Normalized four-state corner-radius disclosure.
 *
 * `unknown` carries no radius at all and must never be treated as `zero`:
 * one says the corners are square, the other says nobody has measured them.
 */
export type CornerRadiusDisclosure =
  | { state: "zero" }
  | { state: "known"; radiusMm: Millimetres }
  | { state: "estimated"; radiusMm: Millimetres }
  | { state: "unknown" };

/**
 * A rectangular sheet carrying a uniform axis-aligned grid of identical square
 * or rounded-rectangle labels. Non-uniform, circular, oval, roll, continuous,
 * or arbitrary die-cut media has no representation here by construction.
 */
export interface SheetGeometry {
  sheet: SheetSize;
  grid: GridCounts;
  label: LabelSize;
  margins: SheetMargins;
  gaps: SheetGaps;
  cornerRadius: CornerRadiusDisclosure;
}

/** The disclosed radius, or null when the geometry makes no radius claim. */
export function cornerRadiusMm(
  cornerRadius: CornerRadiusDisclosure,
): Millimetres | null {
  switch (cornerRadius.state) {
    case "known":
    case "estimated":
      return cornerRadius.radiusMm;
    case "zero":
      return millimetres(0);
    case "unknown":
      return null;
  }
}

/** True when the count is a bounded positive integer. */
export function isGridCount(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_GRID_COUNT &&
    value <= MAX_GRID_COUNT
  );
}

/**
 * Reads a count without accepting anything a Number() coercion would let
 * through: empty text, whitespace, "1e3", "12px", "+3", or a decimal fraction.
 *
 * Range is not judged here — {@link isGridCount} does that — so a caller can
 * tell "not a whole number" apart from "outside the supported range".
 */
export function parseGridCountText(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}
