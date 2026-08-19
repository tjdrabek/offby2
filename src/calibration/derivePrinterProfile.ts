/**
 * Turning measurements into a correction, or refusing to.
 *
 * The arithmetic is trivial — a translation is a subtraction — and almost all
 * of this module is the refusals. That is the right proportion. A profile moves
 * ink on paper the operator has already paid for, and every failure here is one
 * that would otherwise be discovered as a wasted sheet:
 *
 * - a measurement taken from a demo rather than a printer
 * - marks that disagree, meaning the sheet was not merely shifted
 * - sheets that disagree, meaning the setup is not repeatable
 * - a shift too large to be a feed offset rather than a mistyped measurement
 *
 * Every threshold lives in a {@link CalibrationPolicy}. None of them is
 * empirically justified yet: the physical baseline that would justify them has
 * not been measured, so the default is named for what it is.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

import type { SheetLayoutRevisionRef } from "./../sheet-layouts/SheetLayoutRevisionRef";
import type { CalibrationSheetPlan } from "./planCalibrationSheet";
import {
  allPhysical,
  distinctSheetCount,
  observationOf,
  type CalibrationObservationSet,
} from "./PlacementObservation";
import type {
  PlacementTranslation,
  PrinterProfile,
  ProfileEvidence,
} from "./PrinterProfile";

export interface CalibrationPolicy {
  /**
   * The largest disagreement between marks on one sheet still explained by a
   * translation alone. Beyond it, the sheet was scaled, rotated, or mismeasured,
   * and none of those is something this package corrects.
   */
  maxTargetDisagreementMm: number;
  /** The largest disagreement between sheets still treated as one repeatable setup. */
  maxSheetVariationMm: number;
  /** The largest shift a profile may carry, past which a measurement is more likely wrong. */
  maxTranslationMm: number;
  /** Distinct printed sheets required before evidence is more than preliminary. */
  sheetsForConfirmation: number;
}

/**
 * Working thresholds, pending physical measurement.
 *
 * These are placeholders chosen to be plausible for consumer inkjet and laser
 * feed behaviour, not results. The baseline that would replace them — what
 * offsets, scaling and run-to-run variation actually appear on real printers —
 * has not been measured. Treat a profile derived under this policy as evidence
 * about the workflow, not about the printer.
 */
export const PROVISIONAL_CALIBRATION_POLICY: CalibrationPolicy = {
  /*
   * Sized for a hand-held rule, which is what the workflow asks for. Each
   * mark's implied shift is the difference of two readings, and a reading is
   * honestly off by up to half a millimetre — so two well-measured marks can
   * disagree by a millimetre from reading error alone. The old 0.5 mm bound
   * refused nearly every honest set of measurements. Genuine scaling is still
   * caught: the printed-scale check refuses at 0.5 mm over 100 mm, which at
   * the marks' ~150 mm separation shows up long before this bound does.
   */
  maxTargetDisagreementMm: 1.2,
  // Between sheets the noise is averaged over four marks, so the bound is
  // tighter than the per-mark one.
  maxSheetVariationMm: 0.8,
  maxTranslationMm: 10,
  sheetsForConfirmation: 2,
};

export type CalibrationRefusalCode =
  | "calibration-no-observations"
  | "calibration-not-physical"
  | "calibration-target-unobserved"
  | "calibration-unknown-target"
  | "calibration-not-a-translation"
  | "calibration-unstable-setup"
  | "calibration-translation-out-of-range";

export interface CalibrationRefusal {
  code: CalibrationRefusalCode;
  message: string;
}

export type PrinterProfileDerivation =
  | { status: "derived"; profile: PrinterProfile }
  | { status: "refused"; refusals: readonly CalibrationRefusal[] };

export interface DerivePrinterProfileInput {
  plan: CalibrationSheetPlan;
  layoutRevision: SheetLayoutRevisionRef;
  setupId: string;
  sets: readonly CalibrationObservationSet[];
  now: number;
  policy?: CalibrationPolicy;
}

function refusal(
  code: CalibrationRefusalCode,
  message: string,
): CalibrationRefusal {
  return { code, message };
}

/** "1.25 mm", for a message. */
function mm(value: number): string {
  return `${Number(value.toFixed(4))} mm`;
}

/** One mark's implied shift, kept with the mark's name for the messages. */
interface LabelledShift extends PlacementTranslation {
  label: string;
}

/** The shift each mark on one sheet implies, as intended minus observed. */
function shiftsFor(
  plan: CalibrationSheetPlan,
  set: CalibrationObservationSet,
  refusals: CalibrationRefusal[],
): LabelledShift[] {
  const shifts: LabelledShift[] = [];
  for (const target of plan.targets) {
    const observation = observationOf(set, target.id);
    if (!observation) {
      refusals.push(
        refusal(
          "calibration-target-unobserved",
          `Sheet ${set.sheetOrdinal} has no measurement for the ${target.label}. Every mark must be measured before a correction can be derived.`,
        ),
      );
      continue;
    }
    shifts.push({
      label: target.label,
      xMm: target.intendedXMm - observation.observedXMm,
      yMm: target.intendedYMm - observation.observedYMm,
    });
  }
  return shifts;
}

/** The mark whose implied shift sits furthest from the others' average. */
function standoutMark(shifts: readonly LabelledShift[]): LabelledShift {
  const mean = meanShift(shifts);
  return shifts.reduce((worst, shift) =>
    Math.max(Math.abs(shift.xMm - mean.xMm), Math.abs(shift.yMm - mean.yMm)) >
    Math.max(Math.abs(worst.xMm - mean.xMm), Math.abs(worst.yMm - mean.yMm))
      ? shift
      : worst,
  );
}

/** Names an observation of a mark the calibration sheet does not carry. */
function checkUnknownTargets(
  plan: CalibrationSheetPlan,
  set: CalibrationObservationSet,
  refusals: CalibrationRefusal[],
): void {
  const known = new Set(plan.targets.map((target) => target.id));
  for (const observation of set.observations) {
    if (!known.has(observation.targetId)) {
      refusals.push(
        refusal(
          "calibration-unknown-target",
          `Sheet ${set.sheetOrdinal} carries a measurement for "${observation.targetId}", which is not a mark on this calibration sheet.`,
        ),
      );
    }
  }
}

/** The mean of the shifts, which is only meaningful once they agree. */
function meanShift(shifts: readonly PlacementTranslation[]): PlacementTranslation {
  const total = shifts.reduce(
    (sum, shift) => ({ xMm: sum.xMm + shift.xMm, yMm: sum.yMm + shift.yMm }),
    { xMm: 0, yMm: 0 },
  );
  return { xMm: total.xMm / shifts.length, yMm: total.yMm / shifts.length };
}

/** The largest distance between any two of these shifts, on either axis. */
function spread(shifts: readonly PlacementTranslation[]): number {
  if (shifts.length < 2) {
    return 0;
  }
  const xs = shifts.map((shift) => shift.xMm);
  const ys = shifts.map((shift) => shift.yMm);
  return Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
}

/**
 * Derives the correction for one printing setup, or refuses with every reason
 * it could not.
 *
 * All refusals are collected rather than returning the first: an operator
 * holding a printed sheet and a ruler should learn everything that is wrong in
 * one pass, not discover the next problem after correcting this one.
 */
export function derivePrinterProfile(
  input: DerivePrinterProfileInput,
): PrinterProfileDerivation {
  const policy = input.policy ?? PROVISIONAL_CALIBRATION_POLICY;
  const refusals: CalibrationRefusal[] = [];

  if (input.sets.length === 0) {
    return {
      status: "refused",
      refusals: [
        refusal(
          "calibration-no-observations",
          "No calibration sheet has been measured yet.",
        ),
      ],
    };
  }

  // Checked before anything is computed: a demo measurement must not reach the
  // arithmetic at all, so it cannot appear in a message as though it counted.
  if (!allPhysical(input.sets)) {
    refusals.push(
      refusal(
        "calibration-not-physical",
        "A printer profile can only be derived from sheets that were actually printed and measured. Demonstration measurements are excluded.",
      ),
    );
  }

  const perSheet: PlacementTranslation[] = [];
  let worstTargetDisagreementMm = 0;

  for (const set of input.sets) {
    checkUnknownTargets(input.plan, set, refusals);
    const shifts = shiftsFor(input.plan, set, refusals);
    if (shifts.length !== input.plan.targets.length) {
      continue;
    }

    const disagreement = spread(shifts);
    worstTargetDisagreementMm = Math.max(
      worstTargetDisagreementMm,
      disagreement,
    );
    if (disagreement > policy.maxTargetDisagreementMm) {
      // Named so the operator knows where to put the rule next, and worded as
      // what happened rather than as the arithmetic that noticed it.
      refusals.push(
        refusal(
          "calibration-not-a-translation",
          `The marks on sheet ${set.sheetOrdinal} do not agree on a single shift: comparing each to where it should be, their answers are up to ${mm(disagreement)} apart, and up to ${mm(policy.maxTargetDisagreementMm)} of that is accepted as ruler-reading error. The ${standoutMark(shifts).label} stands out the most — re-measure that one first, reading to the nearest half millimetre. If the numbers are right, this sheet printed scaled or rotated, which a whole-sheet shift cannot correct.`,
        ),
      );
      continue;
    }
    perSheet.push(meanShift(shifts));
  }

  if (perSheet.length === 0 && refusals.length === 0) {
    refusals.push(
      refusal(
        "calibration-no-observations",
        "No calibration sheet was measured completely enough to derive a correction.",
      ),
    );
  }

  const worstSheetVariationMm = spread(perSheet);
  if (worstSheetVariationMm > policy.maxSheetVariationMm) {
    refusals.push(
      refusal(
        "calibration-unstable-setup",
        `The sheets disagree by ${mm(worstSheetVariationMm)}, more than the ${mm(policy.maxSheetVariationMm)} this setup is allowed to vary. A correction derived from them would not be repeatable.`,
      ),
    );
  }

  const translationMm =
    perSheet.length > 0 ? meanShift(perSheet) : { xMm: 0, yMm: 0 };
  const largest = Math.max(
    Math.abs(translationMm.xMm),
    Math.abs(translationMm.yMm),
  );
  if (largest > policy.maxTranslationMm) {
    refusals.push(
      refusal(
        "calibration-translation-out-of-range",
        `The measurements imply a shift of ${mm(largest)}, beyond the ${mm(policy.maxTranslationMm)} a feed offset is expected to reach. Check the measurements and which edge they were taken from.`,
      ),
    );
  }

  if (refusals.length > 0) {
    return { status: "refused", refusals };
  }

  const sheetCount = distinctSheetCount(input.sets);
  const evidence: ProfileEvidence =
    sheetCount >= policy.sheetsForConfirmation ? "confirmed" : "preliminary";

  return {
    status: "derived",
    profile: {
      setupId: input.setupId,
      layoutRevision: input.layoutRevision,
      translationMm,
      evidence,
      sheetCount,
      worstTargetDisagreementMm,
      worstSheetVariationMm,
      createdAt: input.now,
    },
  };
}
