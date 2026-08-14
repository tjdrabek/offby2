# PRD 18 — Compose rich responsive label content

## Source and status

- Source: [Issue 18](../../.scratch/reusable-label-printing/issues/18-rich-responsive-label-content.md)
- Status: ready for implementation
- Dependency: PRD 17
- Governing decisions: [ADR-0004](../../docs/adr/0004-use-serializable-label-content-instead-of-user-code.md), [ADR-0005](../../docs/adr/0005-render-a-shared-scene-instead-of-capturing-the-dom.md)

## Overview

Extend the constrained content model from text to QR codes, local images, basic shapes, nested flow layouts, stacks, and explicit overlays. Every component must serialize, persist, lay out, preview, validate, and render to PDF through the same shared printable scene while remaining offline and non-executable.

## Objectives and success criteria

- Provide expressive but constrained application-owned components.
- Keep responsive behavior tied to the physical content region.
- Persist imported images locally and include durable identifiers, not external URLs.
- Maintain preview/PDF scene parity and structured diagnostics for every component.
- Succeed when mixed nested content completes edit-to-PDF and offline recovery with contract, artifact, and browser coverage.

## User flow

A label author adds components, nests row/column/stack flow layouts, chooses physical/percentage/flexible/intrinsic sizing, imports an image, creates a QR code, uses an overlay only for intentional free positioning, previews at multiple zoom levels, undoes/redoes changes, reloads, and generates equivalent PDF output.

## Functional requirements

- **TASK-35:** The versioned content schema supports text, QR code, local image, basic shape, row, column, stack, and overlay elements with explicit discriminated properties.
- **TASK-36:** Row, column, and stack support physical lengths, percentages, flexible space, intrinsic sizing, gaps, alignment, and constrained typography against physical bounds.
- **TASK-37:** Free positioning exists only inside explicit overlay containers and remains bounded by the physical content region.
- **TASK-38:** Imported images are validated, copied into IndexedDB, referenced by durable asset identity, available offline, and independent of external URLs.
- **TASK-39:** QR content produces real deterministic QR geometry with validated payload and sizing, not illustrative marks.
- **TASK-40:** A documented redistributable bundled font set behaves consistently in scene layout, SVG preview, and PDF output.
- **TASK-41:** Schema and UI refuse arbitrary JavaScript, imported React modules, raw persisted CSS, external durable image URLs, and live DOM capture.
- **TASK-42:** Every component participates in editing, persistence, autosave, undo/redo, scene generation, previews, PDF output, backup registration, and structured diagnostics.
- **TASK-43:** Tests cover nesting, mixed sizing, overflow, asset loss, offline assets, QR geometry, overlays, reload, and normalized scene parity between preview and PDF adapters.

## Acceptance criteria

- A mixed nested label survives reload and produces the same normalized scene and deterministic artifact inputs.
- Preview zoom and viewport changes do not alter physical scene layout.
- Removing a referenced local asset produces an element-specific diagnostic rather than an external fetch or silent omission.
- Overlay children cannot escape their declared physical container without a reported violation.
- QR output decodes to the supplied value at supported sizes and remains deterministic.
- Unsupported executable or raw-style payloads fail validation and never execute.
- Full rich-authoring behavior is keyboard operable, including alternatives to direct manipulation, and verified using Playwright.

## Conceptual data touched

`LabelContentNode` is a versioned discriminated tree. `AssetRecord` contains identity, media type, bytes, dimensions, integrity data, and timestamps. `PrintableScene` gains deterministic text, path, image, QR, grouping, clipping, and diagnostic nodes. Authoring truth remains the content tree, not the scene or DOM.

## UI and accessibility principles

Offer semantic add/remove/reorder/property controls and keyboard alternatives for overlay positioning. Expose hierarchy, component names, dimensions, and errors programmatically. Do not make drag-and-drop the only path. Missing-resource, overflow, and unsupported-content warnings require text/icon cues.

## Technical constraints

Pure layout and scene modules do not import React, DOM, storage, QR-library, or PDF-library APIs. Library adapters remain at boundaries. Validate imported media and cap supported sizes. Prototype fake QR, extracted text, rasterized HTML, and partial affine paths are explicitly rejected.

## Prerequisites and access

Requires deterministic text PDF from PRD 17. Implementation must select and document compatible QR/image/font libraries and licenses. No backend, secrets, accounts, services, environment variables, or physical materials are required.

## Security, privacy, and performance

Imported assets remain local. Reject executable formats and unsafe decoding paths; never evaluate content. Large images must not cause unbounded memory or main-thread work; provide diagnostics or bounded processing. Keep typical editing responsive and measure before setting numeric budgets.

## Assumptions and non-goals

Custom font import, user plugins, arbitrary CSS/HTML, executable components, external URL dependence, and unrestricted free positioning are out of scope. This PRD unblocks PRDs 19, 20, and 24.

## Milestone

Complete when all supported components pass schema, persistence, offline, scene, preview, PDF, accessibility, and artifact-parity verification.