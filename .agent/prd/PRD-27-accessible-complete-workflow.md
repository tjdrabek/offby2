# PRD 27 — Complete keyboard and accessibility validation

## Source and status

- Source: [Issue 27](../../.scratch/reusable-label-printing/issues/27-accessible-complete-workflow.md)
- Status: ready after dependent workflows
- Dependencies: PRDs 20, 23, and 25; validates all prior UI PRDs

## Overview

Validate and harden the complete implemented authoring, validation, preparation, calibration-draft, and recovery experience for keyboard and assistive-technology users. Earlier PRDs own baseline accessibility; this PRD closes cross-workflow gaps and documents manual release checks.

## Objectives and success criteria

- Make every primary workflow possible without pointer-only interaction.
- Make state, warnings, errors, and progress understandable programmatically.
- Restore focus predictably after navigation, dialogs, refusals, imports, and generation.
- Combine automated checks, keyboard-driven browser tests, and documented manual screen-reader/zoom checks.
- Succeed with no serious automated violations on primary screens and all documented keyboard journeys passing.

## User flow

A keyboard or assistive-technology user creates a project, edits geometry, authors/reorders/positions content, handles safe-area refusal/override, attests setup, works through calibration draft, prepares PDF, exports/imports backup, and recovers state with no inaccessible shortcut or loss of context.

## Functional requirements

- **TASK-110:** Every primary workflow and action has a keyboard path, including content ordering, position assignment, and overlay positioning through accessible alternatives.
- **TASK-111:** Landmarks, headings, names, roles, values, instructions, and logical visible focus order communicate application structure and control purpose.
- **TASK-112:** Focus restores to the initiating or next logical control after dialogs, navigation, refusals, imports, update prompts, and PDF generation.
- **TASK-113:** Validation errors, compatibility results, calibration/autosave status, storage/import outcomes, and generation completion are announced and associated with affected controls.
- **TASK-114:** Safe-area, provenance, uncalibrated, physical-evidence, partially-used-sheet, offline, and recovery warnings never rely on color alone.
- **TASK-115:** Measurement controls expose units, constraints, source/derived status, allowed ranges, and errors programmatically.
- **TASK-116:** Automated accessibility checks report no serious violations across primary screens, while exceptions are documented and resolved rather than suppressed generically.
- **TASK-117:** Keyboard-driven Playwright tests cover all named primary flows; manual screen-reader and zoom/reflow checks are documented for the release browser set.

## Acceptance criteria

- No required action depends solely on drag, hover, pointer coordinates, or color.
- Keyboard focus is always visible and does not become lost behind changed UI.
- Errors and dynamic statuses are announced once with sufficient context and remain available for review.
- At 200% zoom/reflow, primary actions and information remain available without two-dimensional page scrolling except inherently spatial previews.
- Semantic alternatives expose preview/grid meaning without requiring visual interpretation.
- Automated scans have no serious violations on tested states.
- Complete keyboard journeys pass in Playwright, and manual checks record browser/assistive-technology versions without implying print validation.

## Conceptual data touched

Accessibility metadata is mainly presentation behavior, not new domain truth. Durable user preferences may include measurement/display preferences, reduced motion, and non-color indicators if implemented. Manual validation records belong to release evidence, not physical printing evidence.

## UI principles

Prefer native semantic elements. Use ARIA only where native semantics are insufficient. Manage live regions conservatively, keep error summaries linked to fields, provide skip/navigation mechanisms, honor reduced motion, and separate spatial previews from accessible textual controls.

## Technical constraints

Do not rewrite pure domain rules to satisfy presentation concerns; expose structured reasons so the UI can communicate them. Do not suppress lint/axe findings wholesale. Accessibility tests complement, not replace, manual checks.

## Prerequisites and access

Requires implemented workflows through PRD 25. Playwright and Testing Library are installed. Add a suitable automated accessibility checker during implementation and document its official usage. No accounts, secrets, environment variables, services, physical materials, or test users are required. Manual screen-reader software is a release-test prerequisite, not an application secret.

## Security, privacy, and performance

Announcements must not expose hidden private data unnecessarily. Keyboard and assistive paths must receive equivalent confirmation protections. Focus/status handling should not introduce render loops or input lag; behavioral responsiveness is required, with numeric budgets deferred to measurement.

## Assumptions and non-goals

This PRD does not establish physical output validity or a universal browser/assistive-technology matrix. Pointer interactions may remain as optional enhancements only when equivalent controls exist.

## Milestone

Complete when automated, keyboard, manual screen-reader, zoom/reflow, lint, type, unit, browser, and build checks pass with documented release evidence.