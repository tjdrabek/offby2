/**
 * What an operator measured on a printed calibration sheet.
 *
 * An observation is a physical act recorded as data, and the recording cannot
 * make it true. Two things follow, and both are carried in the type rather than
 * left to a convention a caller could forget:
 *
 * - **Provenance is explicit.** A `demo` observation exists so an interface can
 *   be exercised without a printer; it can never contribute to a profile that
 *   will move real ink. Making it a separate value rather than a flag on a
 *   number means the distinction survives being passed around.
 * - **One sheet is one sheet.** Observations are grouped per printed sheet,
 *   because the difference between two sheets from the same setup is placement
 *   variation, and variation is what decides whether a profile is trustworthy.
 *   Flattening them would discard exactly the evidence that matters.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

/**
 * Where an observation came from.
 *
 * `physical` means someone measured a printed sheet. `demo` means the value was
 * produced without printing anything — for a walkthrough, a test, or a
 * screenshot — and is refused by profile derivation.
 */
export type ObservationProvenance = "physical" | "demo";

/** Where one mark actually landed, measured from the sheet's left and top edges. */
export interface TargetObservation {
  /** The {@link CalibrationTarget} id this measurement is of. */
  targetId: string;
  observedXMm: number;
  observedYMm: number;
}

/**
 * Every mark measured on one printed sheet.
 *
 * `sheetOrdinal` distinguishes repeated prints from the same setup. It is not a
 * count of anything: two observation sets with the same ordinal are the same
 * sheet measured twice, which says nothing about run-to-run variation.
 */
export interface CalibrationObservationSet {
  sheetOrdinal: number;
  provenance: ObservationProvenance;
  /** When the measurement was recorded, for audit rather than for arithmetic. */
  recordedAt: number;
  observations: readonly TargetObservation[];
}

/** True when every set was measured on a physical printed sheet. */
export function allPhysical(
  sets: readonly CalibrationObservationSet[],
): boolean {
  return sets.every((set) => set.provenance === "physical");
}

/** The distinct sheets represented, which is not the same as the number of sets. */
export function distinctSheetCount(
  sets: readonly CalibrationObservationSet[],
): number {
  return new Set(sets.map((set) => set.sheetOrdinal)).size;
}

/**
 * The observation of one target, or undefined when that mark was not measured.
 */
export function observationOf(
  set: CalibrationObservationSet,
  targetId: string,
): TargetObservation | undefined {
  return set.observations.find(
    (observation) => observation.targetId === targetId,
  );
}
