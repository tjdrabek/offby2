# 26 — Derive and apply physically validated translation profiles

**What to build:** After real materials and repeated observations establish the policy, derive an auditable whole-sheet translation profile and apply it consistently to calibration and final printable output for the exact compatible printing setup and sheet-layout revision.

**Blocked by:** 25 — Run an evidence-gated calibration draft; 13 — Obtain physical validation materials; 07 — Establish the uncalibrated printing baseline; 09 — Choose the calibration correction model.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for feasibility of four-corner translation estimation, evidence-carrying profiles, and repeated-sheet confidence language. Prototype measurements, synthetic profiles, and heuristic thresholds are not accepted as physical evidence or production policy.

- [ ] The implemented derivation follows the correction policy and thresholds resolved by the physical baseline and correction-model issues rather than prototype constants.
- [ ] One-sheet results remain preliminary; repeated observations are required for placement-variation, suitability, or higher-confidence conclusions.
- [ ] A saved printer profile carries exact compatibility assumptions, observation provenance, sample count, diagnostics, suitability language, and disclosed applied parameters.
- [ ] The initial applied correction is whole-sheet horizontal and vertical translation in millimetres.
- [ ] Correction signs and coordinate axes are tested identically for calibration marks, label previews, and final PDF content.
- [ ] The application refuses profile creation or final calibrated output when evidence, compatibility, loading confirmation, or print-configuration confirmation is insufficient.
- [ ] Scale, rotation, skew, warping, and per-label correction remain absent unless issue 09 is explicitly reopened and resolved with repeated evidence.
- [ ] Browser and artifact tests demonstrate profile creation from qualifying observations, incompatible-profile refusal, translation application, diagnostics, and print-preparation audit data.