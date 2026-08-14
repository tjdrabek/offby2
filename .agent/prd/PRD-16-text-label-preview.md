# PRD 16 — Author and preview a text label project

## Source and status

- Source: [Issue 16](../../.scratch/reusable-label-printing/issues/16-text-label-preview.md)
- Status: ready for implementation
- Dependency: PRD 15
- Governing decisions: [ADR-0004](../../docs/adr/0004-use-serializable-label-content-instead-of-user-code.md), [ADR-0005](../../docs/adr/0005-render-a-shared-scene-instead-of-capturing-the-dom.md)

## Overview

Deliver the first end-to-end label-content path. A label author selects an exact sheet-layout revision, creates constrained text content as a reusable label content template, assigns it to a position, autosaves it, and sees label and sheet previews rendered from one authoritative framework-neutral printable scene.

## Objectives and success criteria

- Prove the serializable label-content and shared-scene architecture with constrained text.
- Keep layout responsive to physical content dimensions, not viewport or preview size.
- Recover authoring state after reload while keeping session-only controls transient.
- Succeed when scene contracts and browser tests demonstrate assignment, autosave, undo/redo, recovery, and zoom-independent preview.

## Target audience and flow

A label author opens a project, selects an immutable sheet-layout revision, opens Content, creates a text template using bundled typography controls, assigns it to a chosen position, edits while watching label and sheet previews, zooms without changing layout, undoes/redoes edits, and reloads to recover the autosaved project.

## Functional requirements

- **TASK-19:** A project references one exact sheet-layout revision and refuses missing or incompatible revision references with actionable recovery.
- **TASK-20:** A versioned serializable label content template supports constrained text content and typography without raw CSS or executable code.
- **TASK-21:** A user can assign the template to a selected position in stable sheet order and recover the relationship after reload.
- **TASK-22:** A pure layout operation resolves template, physical label dimensions, and assignment into an authoritative framework-neutral printable scene.
- **TASK-23:** Label and sheet React/SVG previews consume that same scene; no second layout source or DOM capture is permitted.
- **TASK-24:** Text wrapping and placement respond only to the physical content region; preview zoom is a post-layout transform that cannot change scene geometry.
- **TASK-25:** Visible edits autosave recoverably and support transient session undo/redo without persisting zoom, selection focus, or history stacks.
- **TASK-26:** Tests assert serialized values, scene geometry, visible previews, persistence, and user flows instead of component internals.

## Acceptance criteria

- A saved text template and assignment recover after reload with the same identifiers and content.
- Label and sheet previews receive equivalent scene content and position geometry.
- Changing browser size or preview zoom does not change wrapping, breakpoints, element bounds, or assignment.
- Undo and redo affect visible authoring changes; reload recovers the latest durable draft but not the old session history.
- Unsupported style or executable payloads are rejected by schema validation.
- Missing sheet-layout revisions produce a clear refusal rather than fallback geometry.
- The full author-and-preview flow is keyboard operable and verified in a browser using Playwright.

## Conceptual data touched

- `LabelProject`: exact sheet-layout revision reference, template references, position assignments, autosaved draft, optional named snapshots.
- `LabelContentTemplate`: identity, schema version, name, serializable text component tree, constrained typography.
- `PrintableScene`: physical bounds, laid-out text runs, diagnostics, and stable position metadata; it is derived, not durable authoring truth.

## UI and accessibility principles

Project navigation uses Content, Sheet, Preview, and Prepare PDF destinations. Controls expose names and current values; autosave and errors are announced without stealing focus. Position selection has a semantic keyboard alternative. Preview remains supplemental to textual state and diagnostics.

## Technical constraints

Pure content layout and scene generation import no React, DOM, storage, or PDF APIs. React renders application-owned components from serialized values. Use only documented bundled fonts. Prototype commit `5f3f67b` supports separation feasibility only; do not reuse extracted-text rendering or dual layout sources.

## Prerequisites and access

Requires PRD 15 and the shell from PRD 14. No services, accounts, environment variables, test users, or physical equipment are required.

## Security, privacy, and performance

Treat text as untrusted data: render as text, validate length, and never execute it. Autosave should debounce or batch safely without risking loss; authoring and zoom should remain responsive at representative text sizes. Numeric budgets await measurement.

## Assumptions and non-goals

Only text is supported here. Rich components, template data slots, safe-area enforcement, PDF output, calibration, and physical claims belong to later PRDs. This PRD unblocks PRD 17.

## Milestone

Complete when one text assignment survives restart and renders through a single tested scene in both previews with accessible editing and stable zoom behavior.