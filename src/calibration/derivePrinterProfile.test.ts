import { describe, expect, it } from "vitest";
import { millimetres, type SheetGeometry } from "../sheet-layouts/SheetGeometry";
import { labelPositions } from "../sheet-layouts/labelPositions";
import { planCalibrationSheet } from "./planCalibrationSheet";
import type { CalibrationObservationSet } from "./PlacementObservation";
import { correctedPoint } from "./PrinterProfile";
import {
  PROVISIONAL_CALIBRATION_POLICY,
  derivePrinterProfile,
} from "./derivePrinterProfile";

const REVISION = { layoutId: "layout-1", revisionNumber: 1 };
const NOW = 1_700_000_000_000;

function geometry(): SheetGeometry {
  return {
    sheet: { widthMm: millimetres(100), heightMm: millimetres(80) },
    grid: { rows: 2, columns: 3 },
    label: { widthMm: millimetres(20), heightMm: millimetres(30) },
    margins: {
      topMm: millimetres(5),
      rightMm: millimetres(15),
      bottomMm: millimetres(35),
      leftMm: millimetres(10),
    },
    gaps: { horizontalMm: millimetres(2.5), verticalMm: millimetres(10) },
    cornerRadius: { state: "zero" },
  };
}

const PLAN = planCalibrationSheet(geometry());

/**
 * A sheet printed with a known shift: every mark lands `shift` away from where
 * it was intended. `skew` displaces the last mark only, which is what a scaled
 * or rotated sheet looks like to these measurements.
 */
function printedWith(
  shift: { xMm: number; yMm: number },
  options: { sheetOrdinal?: number; provenance?: "physical" | "demo"; skewMm?: number } = {},
): CalibrationObservationSet {
  const { sheetOrdinal = 1, provenance = "physical", skewMm = 0 } = options;
  return {
    sheetOrdinal,
    provenance,
    recordedAt: NOW,
    observations: PLAN.targets.map((target, index) => ({
      targetId: target.id,
      observedXMm:
        target.intendedXMm +
        shift.xMm +
        (index === PLAN.targets.length - 1 ? skewMm : 0),
      observedYMm: target.intendedYMm + shift.yMm,
    })),
  };
}

function derive(
  sets: readonly CalibrationObservationSet[],
  policy = PROVISIONAL_CALIBRATION_POLICY,
) {
  return derivePrinterProfile({
    plan: PLAN,
    layoutRevision: REVISION,
    setupId: "setup-1",
    sets,
    now: NOW,
    policy,
  });
}

function codes(result: ReturnType<typeof derive>): string[] {
  return result.status === "refused"
    ? result.refusals.map((one) => one.code)
    : [];
}

describe("derivePrinterProfile", () => {
  it("derives the shift that undoes the observed offset", () => {
    // Printed 2 mm right and 1 mm down of where it was asked to.
    const result = derive([printedWith({ xMm: 2, yMm: 1 })]);
    if (result.status !== "derived") {
      throw new Error(`Expected a profile, got ${JSON.stringify(result)}`);
    }

    // Intended minus observed: the correction moves content back.
    expect(result.profile.translationMm.xMm).toBeCloseTo(-2, 9);
    expect(result.profile.translationMm.yMm).toBeCloseTo(-1, 9);
  });

  it.each(["corner-label-centre", "sheet-corner"] as const)(
    "derives the same shift under the %s placement",
    (placement) => {
      const plan = planCalibrationSheet(geometry(), placement);
      const result = derivePrinterProfile({
        plan,
        layoutRevision: REVISION,
        setupId: "setup-1",
        sets: [
          {
            sheetOrdinal: 1,
            provenance: "physical",
            recordedAt: NOW,
            observations: plan.targets.map((target) => ({
              targetId: target.id,
              observedXMm: target.intendedXMm + 2,
              observedYMm: target.intendedYMm + 1,
            })),
          },
        ],
        now: NOW,
      });
      if (result.status !== "derived") {
        throw new Error(`Expected a profile, got ${JSON.stringify(result)}`);
      }

      expect(result.profile.translationMm.xMm).toBeCloseTo(-2, 9);
      expect(result.profile.translationMm.yMm).toBeCloseTo(-1, 9);
    },
  );

  it("derives no shift from a setup that prints where it is asked to", () => {
    const result = derive([printedWith({ xMm: 0, yMm: 0 })]);
    if (result.status !== "derived") {
      throw new Error("Expected a profile.");
    }

    expect(result.profile.translationMm).toEqual({ xMm: 0, yMm: 0 });
    expect(result.profile.worstTargetDisagreementMm).toBe(0);
  });

  it("binds the profile to the setup and revision it was measured on", () => {
    const result = derive([printedWith({ xMm: 1, yMm: 1 })]);
    if (result.status !== "derived") {
      throw new Error("Expected a profile.");
    }

    expect(result.profile.setupId).toBe("setup-1");
    expect(result.profile.layoutRevision).toEqual(REVISION);
    expect(result.profile.createdAt).toBe(NOW);
  });

  describe("evidence", () => {
    it("keeps one sheet preliminary", () => {
      const result = derive([printedWith({ xMm: 2, yMm: 1 })]);
      if (result.status !== "derived") {
        throw new Error("Expected a profile.");
      }

      // One sheet cannot tell a repeatable bias from one crooked feed.
      expect(result.profile.evidence).toBe("preliminary");
      expect(result.profile.sheetCount).toBe(1);
      expect(result.profile.worstSheetVariationMm).toBe(0);
    });

    it("confirms a correction that repeated across sheets", () => {
      const result = derive([
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 2 }),
      ]);
      if (result.status !== "derived") {
        throw new Error("Expected a profile.");
      }

      expect(result.profile.evidence).toBe("confirmed");
      expect(result.profile.sheetCount).toBe(2);
    });

    it("does not count the same sheet twice towards confirmation", () => {
      const result = derive([
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
      ]);
      if (result.status !== "derived") {
        throw new Error("Expected a profile.");
      }

      // Measuring one sheet twice says nothing about run-to-run variation.
      expect(result.profile.sheetCount).toBe(1);
      expect(result.profile.evidence).toBe("preliminary");
    });
  });

  describe("refusals", () => {
    it("refuses when nothing has been measured", () => {
      expect(codes(derive([]))).toEqual(["calibration-no-observations"]);
    });

    it("refuses a demonstration measurement", () => {
      const result = derive([
        printedWith({ xMm: 2, yMm: 1 }, { provenance: "demo" }),
      ]);

      expect(codes(result)).toContain("calibration-not-physical");
    });

    it("refuses a demonstration measurement even alongside physical ones", () => {
      const result = derive([
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 2, provenance: "demo" }),
      ]);

      expect(codes(result)).toContain("calibration-not-physical");
    });

    it("refuses when a mark was not measured", () => {
      const set = printedWith({ xMm: 2, yMm: 1 });
      const result = derive([
        { ...set, observations: set.observations.slice(1) },
      ]);

      expect(codes(result)).toContain("calibration-target-unobserved");
    });

    it("refuses a measurement of a mark the sheet does not carry", () => {
      const set = printedWith({ xMm: 2, yMm: 1 });
      const result = derive([
        {
          ...set,
          observations: [
            ...set.observations,
            { targetId: "r9c9", observedXMm: 1, observedYMm: 1 },
          ],
        },
      ]);

      expect(codes(result)).toContain("calibration-unknown-target");
    });

    it("refuses marks that disagree by more than a shift can explain", () => {
      const result = derive([printedWith({ xMm: 2, yMm: 1 }, { skewMm: 3 })]);

      // A scaled or rotated sheet, which translation cannot correct.
      expect(codes(result)).toContain("calibration-not-a-translation");
    });

    it("accepts marks that disagree within the policy", () => {
      const result = derive([printedWith({ xMm: 2, yMm: 1 }, { skewMm: 0.2 })]);
      if (result.status !== "derived") {
        throw new Error("Expected small disagreement to be tolerated.");
      }

      // Tolerated, but recorded: the profile discloses how well it agreed.
      expect(result.profile.worstTargetDisagreementMm).toBeCloseTo(0.2, 9);
    });

    it("refuses sheets that disagree with each other", () => {
      const result = derive([
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
        printedWith({ xMm: 6, yMm: 1 }, { sheetOrdinal: 2 }),
      ]);

      expect(codes(result)).toContain("calibration-unstable-setup");
    });

    it("records variation between sheets that agree", () => {
      const result = derive([
        printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
        printedWith({ xMm: 2.3, yMm: 1 }, { sheetOrdinal: 2 }),
      ]);
      if (result.status !== "derived") {
        throw new Error("Expected agreeing sheets to derive.");
      }

      expect(result.profile.worstSheetVariationMm).toBeCloseTo(0.3, 9);
      expect(result.profile.translationMm.xMm).toBeCloseTo(-2.15, 9);
    });

    it("refuses a shift too large to be a feed offset", () => {
      const result = derive([printedWith({ xMm: 40, yMm: 0 })]);

      expect(codes(result)).toContain("calibration-translation-out-of-range");
    });

    it("reports every reason at once", () => {
      const set = printedWith({ xMm: 2, yMm: 1 }, { provenance: "demo" });
      const result = derive([
        { ...set, observations: set.observations.slice(1) },
      ]);

      // An operator with a printed sheet and a ruler should learn everything
      // that is wrong in one pass.
      expect(codes(result)).toEqual(
        expect.arrayContaining([
          "calibration-not-physical",
          "calibration-target-unobserved",
        ]),
      );
    });
  });

  describe("policy", () => {
    it("uses the provisional thresholds by default", () => {
      const result = derivePrinterProfile({
        plan: PLAN,
        layoutRevision: REVISION,
        setupId: "setup-1",
        sets: [printedWith({ xMm: 2, yMm: 1 })],
        now: NOW,
      });

      expect(result.status).toBe("derived");
    });

    it("lets a caller demand more sheets before confirming", () => {
      const result = derive(
        [
          printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 1 }),
          printedWith({ xMm: 2, yMm: 1 }, { sheetOrdinal: 2 }),
        ],
        { ...PROVISIONAL_CALIBRATION_POLICY, sheetsForConfirmation: 3 },
      );
      if (result.status !== "derived") {
        throw new Error("Expected a profile.");
      }

      expect(result.profile.evidence).toBe("preliminary");
    });
  });
});

describe("applying a profile", () => {
  it("moves every label by the correction", () => {
    const result = derive([printedWith({ xMm: 2, yMm: 1 })]);
    if (result.status !== "derived") {
      throw new Error("Expected a profile.");
    }

    const intended = labelPositions(geometry());
    const corrected = labelPositions(geometry(), result.profile);

    expect(corrected).toHaveLength(intended.length);
    corrected.forEach((position, index) => {
      expect(position.xMm).toBeCloseTo(intended[index].xMm - 2, 9);
      expect(position.yMm).toBeCloseTo(intended[index].yMm - 1, 9);
    });
  });

  it("changes nothing but position", () => {
    const result = derive([printedWith({ xMm: 2, yMm: 1 })]);
    if (result.status !== "derived") {
      throw new Error("Expected a profile.");
    }

    const [intended] = labelPositions(geometry());
    const [corrected] = labelPositions(geometry(), result.profile);

    expect(corrected.widthMm).toBe(intended.widthMm);
    expect(corrected.heightMm).toBe(intended.heightMm);
    expect(corrected.cornerRadiusMm).toBe(intended.cornerRadiusMm);
    expect(corrected.index).toBe(intended.index);
  });

  it("cancels the observed error when the sheet is reprinted", () => {
    const result = derive([printedWith({ xMm: 2, yMm: 1 })]);
    if (result.status !== "derived") {
      throw new Error("Expected a profile.");
    }

    // The printer adds its bias to whatever it is sent. Sending the corrected
    // position should therefore land on the intended one.
    const [intended] = labelPositions(geometry());
    const [corrected] = labelPositions(geometry(), result.profile);
    const whereItLands = { xMm: corrected.xMm + 2, yMm: corrected.yMm + 1 };

    expect(whereItLands.xMm).toBeCloseTo(intended.xMm, 9);
    expect(whereItLands.yMm).toBeCloseTo(intended.yMm, 9);
  });

  it("applies the sign convention in exactly one place", () => {
    const result = derive([printedWith({ xMm: 2, yMm: 1 })]);
    if (result.status !== "derived") {
      throw new Error("Expected a profile.");
    }

    expect(correctedPoint(result.profile, 100, 100)).toEqual({
      xMm: 98,
      yMm: 99,
    });
  });
});
