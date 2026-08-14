# 22 — Check profile compatibility and prepare uncalibrated output

**What to build:** Centralize printer-profile compatibility and let a user prepare clearly disclosed uncalibrated PDF output when no compatible profile exists, without inventing correction or suitability claims.

**Blocked by:** 15 — Create and revise a sheet layout; 17 — Generate deterministic text-label PDF output; 21 — Record printing setups and operator confirmations.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for profile metadata and explicit workflow gating. It directly corrects the prototype's incomplete invalidation when layout, configuration, or assumptions change.

- [ ] A versioned printer-profile schema binds exact printing-setup, loading-procedure, print-configuration, sheet-layout identity/revision, and geometry fingerprint assumptions.
- [ ] One pure compatibility operation returns status, structured reasons, required confirmations, and whether recalibration is required.
- [ ] Restored drafts, profile selection, preview, and PDF preparation use the same compatibility operation.
- [ ] Layout, fingerprint, setup, loading-procedure, or print-configuration mismatches reject profile reuse with actionable reasons.
- [ ] Unknown setup details are not wildcards; setup attestation can confirm sameness only when no contradictory known value exists.
- [ ] When no compatible profile exists, users may generate explicitly uncalibrated output with zero correction and no alignment or suitability claim.
- [ ] Print preparations record the compatibility result, setup attestation, print configuration, profile identity if any, and uncalibrated status.
- [ ] Tests cover exact matches, every incompatibility class, newly supplied metadata, unknowns, attestation, missing profiles, and uncalibrated output.