# PRD 15 — Create and revise a sheet layout

## Source and status

- Source: [Issue 15](../../.scratch/reusable-label-printing/issues/15-sheet-layout-revisions.md)
- Status: ready for implementation
- Dependency: PRD 14
- Governing decisions: [ADR-0002](../../docs/adr/0002-build-the-standalone-application-before-extracting-a-package.md), [ADR-0003](../../docs/adr/0003-keep-the-web-application-local-first.md)

## Overview

Create an editor for immutable sheet-layout revisions representing uniform grids of square or rounded-rectangle label boundaries on rectangular sheets. Users may enter familiar units, derive one uniquely solvable value, preview geometry, and preserve honest distinctions among product identity, provenance, and physical verification.

## Objectives and success criteria

- Normalize all domain geometry to millimetres without hiding user input or derivation.
- Refuse contradictory or unsupported geometry instead of correcting it silently.
- Preserve immutable revision history and deterministic geometry fingerprints.
- Make catalog provenance independent from measured physical verification.
- Succeed when contract tests and browser tests cover parsing, derivation, refusals, persistence, revision history, fingerprints, and preview.

## Target audience and flow

A label author creates a new sheet layout or starts from catalog data, chooses a display unit, enters sheet dimensions, grid counts, label dimensions, margins, gaps, and corner radius, resolves errors or accepts one disclosed derivation, checks the preview, and saves. A later geometry edit creates a new revision; independently editing catalog data creates a new identity.

## Functional requirements

- **TASK-10:** Accept sheet width/height, row/column counts, label width/height, four independent margins, horizontal/vertical gaps, and corner-radius state (`zero`, `known`, `estimated`, or `unknown`).
- **TASK-11:** Parse fractional imperial, decimal imperial, and metric input while normalizing calculations to finite millimetre values and retaining display preference.
- **TASK-12:** Derive exactly one missing dimensional value only when one valid solution exists; disclose the derived field, equation, and normalized value.
- **TASK-13:** Return structured refusals for negative, non-finite, contradictory, overlapping, out-of-sheet, overlarge radius, non-uniform, or unsupported media geometry without silent adjustment.
- **TASK-14:** Save geometry changes as immutable revisions under a stable sheet-layout identity and retain prior revisions.
- **TASK-15:** Produce a canonical deterministic geometry fingerprint from normalized geometry; editing catalog data independently creates a new identity.
- **TASK-16:** Store and display product identity, source provenance, and physical-verification status independently; catalog inclusion never implies physical verification.
- **TASK-17:** Render a persisted visual preview of the sheet, margins, gaps, rows, columns, and square or rounded label boundaries from validated geometry.
- **TASK-18:** Verify pure geometry contracts and the visible create/revise/reload workflow.

## Acceptance criteria

- Equivalent imperial and metric inputs normalize to equivalent geometry and fingerprints.
- Exactly one valid missing value is derived; zero, multiple, or contradictory solutions are refused.
- Corner radius cannot exceed half the smaller label dimension; unknown radius remains distinct from zero.
- No invalid value is saved by coercion, clamping, or hidden rounding.
- Saving an edit preserves the old revision and changes the fingerprint only when canonical geometry changes.
- Catalog provenance, product identifiers, and physical-verification status appear as separate labeled values.
- The preview agrees with normalized dimensions and survives reload.
- The complete UI flow and errors are verified in a browser using Playwright.

## Conceptual data touched

`SheetLayout` has stable identity and provenance. `SheetLayoutRevision` contains schema version, revision number, normalized geometry, source-input disclosures, derived-value disclosures, corner-radius state, product identifiers, physical-verification state, geometry fingerprint, and timestamps. Projects reference exact revisions rather than mutable latest values.

## UI and accessibility principles

Measurement inputs expose units, constraints, derivations, and associated errors programmatically. Do not communicate estimated, unknown, unverified, or invalid state by color alone. Preview is explanatory, not an input-only canvas. Every action has a keyboard path and visible focus.

## Technical constraints

Geometry behavior is pure and imports no React, DOM, IndexedDB, or PDF APIs. Use one documented sheet coordinate system and millimetres internally. Supported media is rectangular sheets with uniform axis-aligned square or rounded-rectangle grids. Do not approximate circular, oval, roll, thermal, continuous, duplex, arbitrary die-cut, or non-uniform media.

## Prerequisites and access

PRD 14 persistence and shell must exist. No external services, accounts, secrets, test users, or physical materials are required. Published dimensions may be used as unverified source data but are not physical evidence.

## Security, privacy, and performance

Reject malformed numeric input and boundedly parse fractions to prevent hangs or non-finite propagation. Geometry recalculation and preview updates should remain responsive while typing; expensive work should not block input. Numeric budgets follow representative profiling.

## Assumptions, dependencies, and non-goals

This PRD does not calibrate printers, prove stock dimensions, calculate safe areas, author label content, or generate PDF output. It unblocks PRDs 16, 22, and 24. Physical verification requires later operator evidence.

## Milestone

Complete when the revision editor, persistence, preview, pure contract suite, browser workflow, accessibility baseline, and production checks pass.