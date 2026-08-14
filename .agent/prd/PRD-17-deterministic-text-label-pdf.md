# PRD 17 — Generate deterministic text-label PDF output

## Source and status

- Source: [Issue 17](../../.scratch/reusable-label-printing/issues/17-deterministic-text-label-pdf.md)
- Status: ready for implementation
- Dependency: PRD 16
- Governing decision: [ADR-0005](../../docs/adr/0005-render-a-shared-scene-instead-of-capturing-the-dom.md)

## Overview

Generate downloadable deterministic PDF printable output for the validated text-label scene. The PDF has explicit physical page geometry and bundled font treatment, returns structured diagnostics, and creates an immutable print preparation without claiming that downloading, opening, or printing proves physical placement.

## Objectives and success criteria

- Isolate PDF-library behavior behind a renderer accepting only validated scene and page geometry.
- Produce byte-identical output for identical normalized inputs.
- Preserve audit data for every successful generation.
- Clearly identify output as uncalibrated until a compatible physically supported profile exists.
- Succeed when parsed artifact tests verify page boxes, page count, text placement, fonts, determinism, diagnostics, and stable hashes.

## User flow

From Prepare PDF, the user reviews the selected sheet-layout revision and positions, sees uncalibrated and software-evidence disclosures, requests generation, resolves any structured refusal, downloads or opens the result, and can inspect the immutable print preparation separately from any physical-print history.

## Functional requirements

- **TASK-27:** The PDF renderer accepts a validated printable scene, explicit page geometry, resolved bundled fonts/assets, and optional compatible translation data only.
- **TASK-28:** Convert millimetres to PDF points only at the renderer boundary and create page boxes matching the selected sheet dimensions.
- **TASK-29:** Embed or outline all used bundled font glyphs so installed system fonts cannot affect output.
- **TASK-30:** Canonically order and encode inputs so identical normalized inputs produce byte-identical bytes and the same content hash.
- **TASK-31:** Return structured diagnostics for missing fonts/assets, unsupported scene nodes, overflow, and rendering failures; unsuccessful generation creates no success record.
- **TASK-32:** Every successful generation saves an immutable print preparation containing project snapshot, output hash, timestamp, sheet-layout revision/fingerprint, positions, uncalibrated status, overrides, and diagnostics.
- **TASK-33:** Download/open actions remain distinct from physical printing and never create a physical-print assertion.
- **TASK-34:** Artifact and browser tests verify renderer contracts, visible refusal/success states, audit persistence, and evidence disclosures.

## Acceptance criteria

- Parsed page boxes equal normalized sheet dimensions converted with the documented constant.
- Repeated generation from identical normalized inputs yields identical bytes and hashes.
- Text positions match the authoritative scene within renderer precision and required glyphs are embedded or outlined.
- Missing required resources return named diagnostics and no downloadable partial success.
- A successful print preparation can reproduce the exact generation inputs and remains immutable.
- UI copy states that PDF geometry is software evidence only and does not prove physical scale, placement, or printing.
- Generate, diagnose, download/open, and inspect-preparation behavior is verified in a browser using Playwright.

## Conceptual data touched

`PdfResult` contains bytes, hash, diagnostics, page count, and normalized generation metadata. `PrintPreparation` captures exact project snapshot, layout revision and fingerprint, selected positions, profile/compatibility fields where available, setup attestation where available, uncalibrated flag, overrides, diagnostics, and timestamp.

## UI and accessibility principles

Generation status, refusals, diagnostics, completion, and download controls are keyboard operable and announced. Long work shows progress or an honest busy state and leaves the user able to recover from failure. Disclosures do not rely on color.

## Technical constraints

Never capture DOM or use preview pixels as the printable source. Contain PDF-library types, browser download APIs, font encoding, and asset encoding outside pure domain modules. Prototype commit `5f3f67b` proves client-side feasibility only; its ad hoc writer and raster shortcuts are not production code or evidence.

## Prerequisites and access

Requires PRD 16. A production PDF library and redistributable bundled font set must be selected and their licenses documented during implementation. No secret, service account, backend, test user, or environment variable is required.

## Security, privacy, and performance

PDF generation is local. Bound resource sizes and validate all scene/resource inputs. Avoid embedding private metadata not included in the print preparation. Generation must not freeze the UI for unbounded periods; report progress or failure and preserve the draft. Numeric budgets follow representative profiling.

## Assumptions and non-goals

Exact page boxes are not physical evidence. This PRD does not control print dialogs, detect printers, claim printing occurred, calibrate output, or establish alignment tolerance. It unblocks PRDs 18, 22, and 25.

## Milestone

Complete when deterministic parsed artifacts, immutable preparations, visible uncalibrated disclosures, accessible browser flow, and production checks pass.