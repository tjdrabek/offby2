# PRD 25 — Run an evidence-gated calibration draft

## Source and status

- Source: [Issue 25](../../.scratch/reusable-label-printing/issues/25-evidence-gated-calibration-draft.md)
- Status: ready for software implementation with physical-evidence limitations
- Dependencies: PRDs 17, 21, and 22; portability participation from PRD 24

## Overview

Create a serializable calibration-draft workflow that generates a controlled calibration PDF, records operator observations with provenance, restores safely, and explains diagnostics. Demo and software-only evidence remain separate and can never create a production printer profile. This PRD establishes workflow and refusal behavior, not correction policy or suitability thresholds.

## Objectives and success criteria

- Model calibration as explicit validated state transitions.
- Carry one immutable sheet-layout revision throughout the draft.
- Separate generated artifact structure, demo observations, and operator-entered physical observations.
- Preserve and revalidate drafts through restart, export/import, migration, and deletion.
- Succeed when every transition, refusal, restoration, invalidation, provenance path, and artifact structure is tested without creating a usable profile.

## User flow

An operator starts a draft, selects a layout revision, identifies setup, confirms print configuration, generates a calibration PDF, reviews asymmetric loading/plain-paper guidance, records observations with units/provenance/sample identity, reviews diagnostics, and restores later. Demo entry is clearly marked and cannot pass physical gates.

## Functional requirements

- **TASK-92:** Define serializable states for layout selection, setup identification, configuration confirmation, calibration generation, plain-paper inspection, observation entry, diagnostics, and draft completion.
- **TASK-93:** Every transition validates current prerequisites and returns structured actionable refusals without mutating state on failure.
- **TASK-94:** Draft restoration reruns current invariants and refuses stale layout/setup/configuration assumptions explicitly.
- **TASK-95:** One exact immutable sheet-layout revision and fingerprint flow through draft identity, calibration scene/artifact, observations, diagnostics, and later compatibility.
- **TASK-96:** Calibration PDF uses explicit physical page geometry and documented measurement marks but is labeled software-generated structure, never physical evidence.
- **TASK-97:** Plain-paper inspection and observation entry require one production-defined set of loading fields; UI and domain agree on required, diagnostic, and optional values.
- **TASK-98:** Demo observations are visibly marked, stored separately by provenance, and cannot satisfy any physical-evidence transition or profile gate.
- **TASK-99:** Operator-entered physical observations retain provenance, sample identity, setup/configuration assumptions, units, raw values, and diagnostics without being automatically declared valid.
- **TASK-100:** No prototype heuristic becomes a production tolerance/suitability threshold and draft completion creates no usable printer profile.
- **TASK-101:** Calibration drafts participate in persistence, workspace export/import/migration/deletion, and comprehensive state/artifact/browser tests.

## Acceptance criteria

- Every valid state has explicit allowed next actions; out-of-order actions return stable reasons and preserve state.
- Restoring after a referenced revision/configuration change surfaces invalidation before continuing.
- Parsed calibration PDFs have expected page boxes and marks, but UI never labels that result physical evidence.
- Demo observations remain queryably distinct after restart/export/import and cannot unlock profile creation.
- Physical-provenance records require all defined provenance fields but remain unvalidated observations until later evidence policy.
- No numeric prototype threshold appears in domain decisions or user claims.
- The entire draft and refusal journey is keyboard operable and verified using Playwright.

## Conceptual data touched

`CalibrationDraft` contains identity, schema version, explicit state, exact layout/setup/loading/configuration references, calibration artifact metadata, inspections, observations, diagnostics, and timestamps. `CalibrationObservation` records provenance (`demo` or operator-entered physical), sample identity, units, raw values, assumptions, and diagnostics.

## UI and accessibility principles

Use a resumable progress model, not a wizard that hides earlier assumptions. Announce state/refusals, associate fields/errors, identify demo data persistently, and provide textual loading guidance. Focus must survive refusals, generation, and restoration.

## Technical constraints

The state machine is pure; effects execute only after accepted transitions. The same layout and renderer boundaries serve calibration and final scenes. Prototype commit `5f3f67b` is feasibility evidence only; do not copy weak gates, heuristic thresholds, or competing layouts.

## Prerequisites and access

Software implementation requires no service, secret, account, environment variable, or test user. Real calibration use requires a printer, identified label stock, measuring tools, repeated fresh sheets, and operator observations; these are unavailable. User approved proceeding with this PRD behind that explicit gap. Missing materials do not block state/refusal/demo testing and must not be simulated as evidence.

## Security, privacy, and performance

Observations and hardware metadata stay local. Validate all numeric/unit input and imported drafts. Artifact generation must show recoverable progress/failure and preserve drafts. Numeric performance budgets await profiling.

## Assumptions and non-goals

This PRD does not derive/apply correction, create profiles, validate alignment tolerance, establish suitability, or count demo/PDF structure as evidence. It unblocks PRDs 26–28 while PRD 26 remains physically blocked.

## Milestone

Complete when the evidence-safe state machine, deterministic artifact, provenance separation, persistence/portability, accessible browser flow, and all refusal tests pass.