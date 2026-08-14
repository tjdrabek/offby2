# PRD 22 — Check profile compatibility and prepare uncalibrated output

## Source and status

- Source: [Issue 22](../../.scratch/reusable-label-printing/issues/22-profile-compatibility-and-uncalibrated-output.md)
- Status: ready for implementation
- Dependencies: PRDs 15, 17, and 21

## Overview

Create one authoritative pure compatibility operation for exact printer-profile assumptions, and keep the product useful when no compatible profile exists by allowing clearly disclosed zero-correction uncalibrated output. Compatibility results remain consistent across restored drafts, selection, preview, and PDF preparation.

## Objectives and success criteria

- Bind profile identity to exact setup, loading, configuration, and sheet-layout assumptions.
- Return structured, actionable compatibility results from one source.
- Treat unknown details as unknown—not wildcards.
- Permit honest uncalibrated generation with no correction or suitability claim.
- Succeed when every mismatch class, refinement, unknown, attestation, missing-profile, and uncalibrated path is tested.

## User flow

A user chooses a project, setup/configuration, and optional printer profile. The application evaluates compatibility, explains confirmations or recalibration needs, refuses incompatible profile application, and offers zero-correction uncalibrated preparation when software validations pass.

## Functional requirements

- **TASK-68:** A versioned printer profile binds exact printing-setup identity, loading-procedure revision, print-configuration revision, sheet-layout identity/revision, and canonical geometry fingerprint.
- **TASK-69:** One pure compatibility operation returns status, structured reasons, required confirmations, and recalibration requirement.
- **TASK-70:** Restored drafts, profile selection, preview, and PDF preparation invoke the same operation and display equivalent outcomes.
- **TASK-71:** Layout identity/revision/fingerprint, contradictory setup, loading-procedure, or print-configuration mismatch rejects profile reuse with specific reasons.
- **TASK-72:** Unknown setup fields are never wildcard matches; attestation can confirm sameness only where no known contradiction exists.
- **TASK-73:** Non-contradictory newly supplied metadata refines identification without automatically invalidating observations or inventing compatibility.
- **TASK-74:** With no compatible profile, a user may generate explicitly uncalibrated output using exactly zero correction after all software validations pass.
- **TASK-75:** Print preparation records the compatibility result, confirmations, setup attestation, print configuration, optional profile identity, and uncalibrated status.

## Acceptance criteria

- Exact assumptions yield the documented compatible status and required confirmations.
- Each mismatch field produces a stable machine-readable reason and clear user action.
- A known contradiction cannot be overridden by generic attestation.
- Missing/incompatible profile paths never apply stale correction.
- Uncalibrated PDF bytes use zero translation and display no alignment/suitability claim.
- Compatibility results saved in preparations match those shown before generation.
- Selection, explanation, attestation, refusal, and uncalibrated generation are keyboard operable and verified using Playwright.

## Conceptual data touched

`PrinterProfile` initially carries identity and exact compatibility assumptions; physical observation/correction fields remain gated. `CompatibilityRequest` and `CompatibilityResult` are versioned serializable values. Result includes status, reasons, confirmations, and recalibration flag.

## UI and accessibility principles

Explain compatibility in text with reason-by-reason next actions. Announce changes and associate confirmations with controls. “Uncalibrated” is persistent, not color-only, and appears before generation and in preparation details.

## Technical constraints

Compatibility is pure and centralized. Missing values are explicit. No UI or renderer may independently infer compatibility. Uncalibrated output always means zero correction. Prototype invalidation rules are insufficient and must not be copied.

## Prerequisites and access

Requires exact revisions from PRD 15, deterministic PDF/preparations from PRD 17, and setup assumptions from PRD 21. No real profile, physical evidence, service, secret, account, environment variable, or test user is required to implement uncalibrated behavior.

## Security, privacy, and performance

Keep setup/profile metadata local. Validate imported or restored values before compatibility evaluation. The pure operation should be fast and side-effect-free; repeated UI evaluation must not block interaction.

## Assumptions and non-goals

This PRD defines profile compatibility shape but does not create physically valid profiles. It does not claim alignment, suitability, feed consistency, or physical verification. It unblocks PRDs 23, 24, and 25.

## Milestone

Complete when all compatibility contracts, consistent UI consumers, uncalibrated zero-correction output, preparation audit, accessible browser tests, and artifact checks pass.