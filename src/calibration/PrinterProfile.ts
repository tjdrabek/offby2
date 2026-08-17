/**
 * Calibration data for one printing setup, and the single rule for using it.
 *
 * ## Sign convention
 *
 * `translationMm` is **intended minus observed**, and it is **added** to an
 * intended position to obtain a corrected one. If a setup prints 2 mm to the
 * right of where it was asked to, the observed x exceeds the intended x, the
 * translation is −2 mm, and adding it moves the content back to the left.
 *
 * That sentence is the whole convention. It is stated here, once, because a
 * sign error in a correction is invisible on screen and doubles the error on
 * paper — the one failure mode where "it looked fine in the preview" is exactly
 * what you would expect to see.
 *
 * ## Why translation only
 *
 * A profile carries a whole-sheet x/y shift and nothing else. Scaling, rotation
 * and per-label correction are excluded by construction, not left out pending
 * effort: correcting them requires evidence this package has no way to demand,
 * and a model that can express them will silently absorb a measurement mistake
 * into a plausible-looking transform. Where the evidence shows something that
 * is not a translation, derivation refuses and says so.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import {
  sameRevision,
  type SheetLayoutRevisionRef,
} from "./../sheet-layouts/SheetLayoutRevisionRef";

/** The correction itself: a whole-sheet shift, in millimetres. */
export interface PlacementTranslation {
  xMm: number;
  yMm: number;
}

/**
 * How much the evidence supports the profile.
 *
 * `preliminary` means the correction came from a single printed sheet, which
 * cannot distinguish a repeatable bias from one sheet that fed crookedly.
 * `confirmed` means repeated sheets agreed. Neither is a claim about a sheet
 * that has not been printed yet.
 */
export type ProfileEvidence = "preliminary" | "confirmed";

export interface PrinterProfile {
  /**
   * The printing setup this was measured on, as an opaque identity supplied by
   * the host.
   *
   * A printing setup is a real thing — printer, driver, operating system,
   * browser, print configuration, loading procedure — and modelling it is its
   * own piece of work that has not been done. Until it is, a profile records
   * *which* setup it belongs to without pretending to describe it, so a host
   * can already refuse to apply a profile from a different one.
   */
  setupId: string;
  /**
   * The exact sheet-layout revision the calibration sheet was generated from.
   * A profile measured against one geometry says nothing about another.
   */
  layoutRevision: SheetLayoutRevisionRef;
  translationMm: PlacementTranslation;
  evidence: ProfileEvidence;
  /** Distinct printed sheets the correction was measured from. */
  sheetCount: number;
  /**
   * The largest disagreement between marks on one sheet, in millimetres.
   *
   * Kept because it is the evidence that the correction really is a
   * translation. A profile derived from marks that disagreed by almost the
   * whole tolerance is worth less than one derived from marks that agreed
   * exactly, and nothing else in the record would show that.
   */
  worstTargetDisagreementMm: number;
  /** The largest disagreement between sheets, or 0 when there was only one. */
  worstSheetVariationMm: number;
  createdAt: number;
}

/**
 * The corrected position of a point, under this profile.
 *
 * The only place the sign convention is applied. Everything that corrects a
 * position goes through here rather than adding the translation itself, so
 * there is one implementation to get right and one to test.
 */
export function correctedPoint(
  profile: PrinterProfile,
  xMm: number,
  yMm: number,
): { xMm: number; yMm: number } {
  return {
    xMm: xMm + profile.translationMm.xMm,
    yMm: yMm + profile.translationMm.yMm,
  };
}

/** True when the profile was measured against this exact layout revision. */
export function profileMatchesRevision(
  profile: PrinterProfile,
  revision: SheetLayoutRevisionRef,
): boolean {
  return sameRevision(profile.layoutRevision, revision);
}
