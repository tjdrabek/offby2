# 25 — Run an evidence-gated calibration draft

**What to build:** Let an operator progress through and restore a calibration draft, generate a controlled calibration PDF, record observations with provenance, and inspect diagnostics without allowing demo or software-only evidence to create a production printer profile.

**Blocked by:** 17 — Generate deterministic text-label PDF output; 21 — Record printing setups and operator confirmations; 22 — Check profile compatibility and prepare uncalibrated output.

**Status:** ready-for-agent

**Prototype evidence:** This slice directly relies on the browser PDF calibration prototype (commit `5f3f67b`) for its explicit serializable states, deterministic calibration artifact, four-corner measurement approach, asymmetric loading guidance, draft restoration, provenance separation, and refusal behavior. It must correct the prototype's weak plain-paper gate, competing layout sources, heuristic thresholds, and incomplete invalidation.

- [ ] One explicit state machine covers sheet-layout selection, printing-setup identification, print-configuration confirmation, calibration generation, plain-paper inspection, physical-observation entry, diagnostics, and draft completion.
- [ ] Every transition validates prerequisites and returns actionable structured refusals; restoring a draft reruns current invariants.
- [ ] One immutable sheet-layout revision flows through calibration artifact, observations, draft identity, preview, and later compatibility checks.
- [ ] Calibration PDF output has explicit page geometry and documented measurement marks, but its structure is never labeled physical evidence.
- [ ] Plain-paper observations consistently require the production-defined loading fields; required, diagnostic, and optional observations agree between UI and domain rules.
- [ ] Demo observations are visibly marked, persist separately, and cannot unlock or masquerade as physical profile evidence.
- [ ] Operator-entered physical observations retain provenance, sample identity, setup/configuration assumptions, units, and diagnostics.
- [ ] No prototype heuristic becomes a production tolerance or suitability threshold, and this ticket does not create a usable printer profile.
- [ ] Calibration drafts participate in workspace export, import, migration, and deletion.
- [ ] State-machine, artifact, persistence, invalidation, provenance, and refusal tests cover every transition and restoration path.