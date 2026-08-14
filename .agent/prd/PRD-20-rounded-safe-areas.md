# PRD 20 — Enforce rounded safe areas and content insets

## Source and status

- Source: [Issue 20](../../.scratch/reusable-label-printing/issues/20-rounded-safe-areas.md)
- Status: ready for implementation
- Dependency: PRD 18
- Related dependency: PRD 19 for complete assignment/pagination coverage

## Overview

Compute and display the usable rounded region of each label from the label boundary, requested alignment tolerance, and additional user-selected content inset. Continuously identify offending scene elements, refuse PDF preparation by default, and permit only an explicit auditable override that makes no physical-safety claim.

## Objectives and success criteria

- Model rounded safe areas using actual sheet-layout geometry.
- Keep content inset separate from and additive to alignment tolerance.
- Give continuous element-specific diagnostics in label and sheet previews.
- Preserve an advanced override without weakening evidence language.
- Succeed when geometry and browser tests cover square, rounded, unknown-radius, extreme-inset, nested, overlay, refusal, and audit cases.

## User flow

A label author sets an alignment tolerance and uniform or per-side content inset, sees boundary/safe-area/content-region overlays and violations, corrects content or requests an advanced override, confirms the named violations, and generates output whose print preparation records the decision.

## Functional requirements

- **TASK-52:** Compute safe area as the inward offset of the rounded label boundary by requested alignment tolerance in millimetres.
- **TASK-53:** Apply uniform or independent top/right/bottom/left content inset as a second inward reduction distinct from sheet-layout margins and alignment tolerance.
- **TASK-54:** Validate authoritative scene geometry against the resulting rounded content region and return element-specific structured violations.
- **TASK-55:** Label and sheet previews continuously distinguish label boundary, safe area, content region, and violations without changing printable layout.
- **TASK-56:** Unknown corner radius permits editing and output but returns a visible diagnostic and prohibits a corner-safety conclusion.
- **TASK-57:** Any non-overridden violation blocks PDF preparation by default with actionable remediation.
- **TASK-58:** An advanced explicit confirmation may override named violations for one preparation only and never establishes physical safety.
- **TASK-59:** Print preparations retain exact violation and override records; contract, browser, and artifact tests verify refusals and audit data.

## Acceptance criteria

- Zero, known rounded, estimated rounded, and unknown radii produce distinct validation outcomes.
- Content inset always adds clearance after tolerance and cannot silently replace it.
- Impossible/extreme inset values are refused with named constraints rather than yielding invalid geometry.
- Every violation identifies its assignment, scene element, and reason.
- PDF generation is unavailable until violations are resolved or explicitly overridden.
- Override confirmation lists affected violations and the saved preparation reproduces them.
- UI never labels clipping, preview masks, PDF page boxes, or an override as proof of physical containment.
- The correction/refusal/override flow is keyboard operable and verified using Playwright.

## Conceptual data touched

`SafetyRequest` contains alignment tolerance and content insets. `SafeRegionResult` contains boundary, safe area, content region, radius confidence, and diagnostics. `SceneViolation` references assignment and element. `PreparationOverride` captures violation identity, disclosure, and explicit confirmation.

## UI and accessibility principles

Warnings include text and iconography, not color alone. Errors associate with inset/tolerance controls and offending content. Preview overlays can be toggled without hiding equivalent textual diagnostics. Focus returns predictably from override dialogs.

## Technical constraints

Safe-region math and scene validation are pure and use millimetres. Preview clipping is display-only and cannot erase diagnostics. No numeric alignment tolerance may be presented as validated until physical evidence supports it; user-requested values are assumptions recorded with output.

## Prerequisites and access

Requires the rich shared scene from PRD 18. No external services, accounts, secrets, environment variables, or physical materials are required to implement software behavior. Physical materials are required for validated tolerance claims, which remain unavailable.

## Security, privacy, and performance

Validate finite non-negative tolerances/insets and bound geometric complexity. Continuous validation should be incremental or scheduled so editing stays responsive. Do not send scene content elsewhere.

## Assumptions and non-goals

This PRD does not prove die-cut accuracy, physical placement, alignment tolerance, or safe output. Arbitrary die cuts are excluded. It unblocks PRD 27 and participates in PRD 28.

## Milestone

Complete when safe-region contracts, continuous accessible diagnostics, default refusal, one-preparation override, preparation audit, and browser verification pass.