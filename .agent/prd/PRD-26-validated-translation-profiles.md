# PRD 26 — Derive and apply physically validated translation profiles

## Source and status

- Source: [Issue 26](../../.scratch/reusable-label-printing/issues/26-validated-translation-profiles.md)
- Status: specification ready; implementation blocked by physical evidence
- Dependencies: PRD 25 and source issues [13](../../.scratch/reusable-label-printing/issues/13-obtain-physical-validation-materials.md), [07](../../.scratch/reusable-label-printing/issues/07-uncalibrated-printing-baseline.md), and [09](../../.scratch/reusable-label-printing/issues/09-calibration-correction-model.md)

## Overview

After real materials and repeated observations establish evidence policy, derive an auditable printer profile containing whole-sheet horizontal and vertical translation in millimetres and apply it consistently to calibration and final scenes for the exact compatible setup and layout revision. Until the physical blockers resolve, implementation must stop at explicit gates and must not invent thresholds or profiles.

## Objectives and success criteria

- Base derivation and suitability language only on resolved physical policy.
- Keep one-sheet results preliminary and distinguish placement bias from placement variation.
- Bind profile evidence and correction to exact compatibility assumptions.
- Apply coordinate signs identically across previews, calibration marks, and PDFs.
- Succeed only after qualifying real observations exist and browser/artifact tests demonstrate creation, refusal, application, diagnostics, and audit records.

## User flow

After completing qualifying physical observations, an operator reviews provenance/sample count/diagnostics, requests profile derivation, resolves insufficiency or incompatibility refusals, saves the profile, reconfirms loading/configuration, previews disclosed translation, and prepares calibrated output whose preparation records the exact profile and evidence language.

## Functional requirements

- **TASK-102:** Profile derivation remains disabled until issues 13, 07, and 09 define available materials, repeated-observation baseline, evidence thresholds, and correction policy.
- **TASK-103:** Once unblocked, derivation consumes only qualifying physical observations and follows resolved policy rather than prototype/synthetic constants.
- **TASK-104:** One-sheet results remain preliminary; placement-variation, suitability, and higher-confidence language require the policy-defined repeated samples.
- **TASK-105:** A saved profile carries exact setup/loading/configuration/layout/fingerprint assumptions, observation provenance, sample count, diagnostics, suitability language, and disclosed parameters.
- **TASK-106:** Initial correction supports only whole-sheet horizontal and vertical translation in millimetres.
- **TASK-107:** One documented coordinate/sign convention applies translation identically to calibration marks, label preview scenes, and final PDF content.
- **TASK-108:** Profile creation and calibrated generation refuse insufficient evidence, incompatibility, missing loading confirmation, or missing print-configuration confirmation with structured reasons.
- **TASK-109:** Scale, rotation, skew, warping, and per-label correction remain absent unless issue 09 is explicitly reopened and resolved using repeated physical evidence.

## Acceptance criteria

- Before blockers resolve, the UI and domain refuse derivation and name the unmet physical prerequisites.
- After resolution, only observations satisfying documented policy can create a profile.
- Profile records reproduce their source observations, assumptions, sample count, diagnostics, language, and x/y values.
- One-sample data cannot produce validated suitability/variation language.
- Positive/negative x/y fixtures move calibration and label scene coordinates consistently, and parsed PDF coordinates agree.
- Any compatibility or confirmation failure prevents applying correction.
- Profile review, refusal, confirmation, and preparation are keyboard operable and verified using Playwright once physical policy exists.

## Conceptual data touched

`PrinterProfile` includes schema version, exact compatibility references, evidence references, sample count, diagnostics, confidence/suitability language, and `translationXMillimetres`/`translationYMillimetres`. `ProfileDerivationResult` is success or structured refusal. Preparations snapshot application and compatibility results.

## UI and accessibility principles

Evidence sufficiency and preliminary/validated language are explicit text, not color. Show applied parameters and assumptions before use. Refusals identify corrective action and preserve focus. Never simplify “physically observed” into “guaranteed.”

## Technical constraints

Translation derivation/application are pure and millimetre-based. PDF conversion occurs only at renderer boundary. No heuristic threshold from prototype commit `5f3f67b` is acceptable. Do not add correction degrees of freedom without an ADR/issue reopening backed by evidence.

## Prerequisites and access

**Blocking gap:** no known printer, stock, fresh-sheet inventory, measuring tools, or observations. The user approved documenting this PRD but not bypassing the gate. No service, secret, account, environment variable, MCP authentication, or test user is required. Real values/observations must be entered by the operator and never fabricated.

## Security, privacy, and performance

Profiles remain local and carry potentially identifying hardware metadata. Validate all observation/profile imports. Derivation is expected to be bounded; correctness and evidence traceability take priority over premature optimization.

## Assumptions and non-goals

No universal alignment tolerance, browser matrix, suitable setup, physical verification, or feed-consistency claim exists today. This PRD excludes all non-translation correction until formally reopened.

## Milestone

Blocked until physical prerequisites and policy issues resolve. Completion then requires physical-provenance evidence, pure derivation contracts, scene/PDF sign tests, accessible browser flow, and immutable preparation audits.