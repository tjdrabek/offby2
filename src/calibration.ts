/**
 * offby2/calibration — measuring where a printing setup actually puts
 * content, and correcting for it.
 *
 * A calibration sheet is printed, the operator reports where its targets
 * landed, and a printer profile is derived from that evidence — translation
 * only, by policy (see calibration/PrinterProfile.ts for why). The profile
 * then corrects any point printed with the same setup against the same
 * layout revision.
 */

// Planning the sheet whose printed targets the operator will measure.
export {
  calibrationSheet,
  type CalibrationSheetPlan,
  type CalibrationTarget,
} from "./calibration/calibrationSheet";

// What the operator reports back.
export {
  type CalibrationObservationSet,
  type ObservationProvenance,
  type TargetObservation,
} from "./calibration/PlacementObservation";

// Deriving a profile from the evidence, or refusing to.
export {
  PROVISIONAL_CALIBRATION_POLICY,
  derivePrinterProfile,
  type CalibrationPolicy,
  type CalibrationRefusal,
  type CalibrationRefusalCode,
  type DerivePrinterProfileInput,
  type PrinterProfileDerivation,
} from "./calibration/derivePrinterProfile";

// Using the profile: correcting points, checking it still applies.
export {
  correctedPoint,
  profileMatchesRevision,
  type PlacementTranslation,
  type PrinterProfile,
  type ProfileEvidence,
} from "./calibration/PrinterProfile";

// Reading where the printing setup stops printing: the edge cut-off ladder.
export {
  CUTOFF_LINES,
  CUTOFF_RUN_MM,
  CUTOFF_STEP_MM,
  NO_CUTOFF_COUNTS,
  NO_EDGE_CUTOFF,
  SHEET_EDGES,
  cutoffMm,
  cutoffWarnings,
  edgeCutoffAllowance,
  edgeCutoffLadder,
  type CutoffCounts,
  type CutoffLadderLineMm,
  type CutoffWarning,
  type SheetEdge,
} from "./calibration/edgeCutoff";
