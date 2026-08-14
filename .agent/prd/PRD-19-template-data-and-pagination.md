# PRD 19 — Fill sheets from reusable templates and per-label data

## Source and status

- Source: [Issue 19](../../.scratch/reusable-label-printing/issues/19-template-data-and-pagination.md)
- Status: ready for implementation
- Dependency: PRD 18
- Governing decisions: [ADR-0004](../../docs/adr/0004-use-serializable-label-content-instead-of-user-code.md), [ADR-0005](../../docs/adr/0005-render-a-shared-scene-instead-of-capturing-the-dom.md)

## Overview

Let one label content template produce many labels from named data while preserving intentional per-label overrides. Users may mix independent content, select sparse positions, skip unavailable positions, and paginate deterministically across sheets without flattening template relationships.

## Objectives and success criteria

- Reuse one serializable composition safely across many assignments.
- Preserve data, overrides, and template identity through edits, snapshots, persistence, and preparations.
- Define position order once for assignment, preview, pagination, used-position handling, and output.
- Succeed when mixed and sparse multi-page projects recover and produce matching preview/PDF ordering.

## User flow

A label author defines named inputs and defaults on a template, assigns it to several positions with different values, overrides one instance, places unrelated content elsewhere, selects available positions, previews deterministic pages, edits the shared template, and generates output whose order matches preview.

## Functional requirements

- **TASK-44:** A label content template defines named typed data inputs with optional defaults and validation rules.
- **TASK-45:** Each template assignment stores only template identity, per-label data, and optional constrained overrides rather than copying the full component tree.
- **TASK-46:** Any position may instead reference independent serializable label content unrelated to a template.
- **TASK-47:** One documented stable position order governs assignment, availability, preview, pagination, and PDF output.
- **TASK-48:** Users can select any available positions and skip unavailable positions without implicit reordering.
- **TASK-49:** Assignments exceeding one sheet paginate deterministically; sheet preview and PDF use the same page and position plan.
- **TASK-50:** Editing a shared template updates its instances while retaining compatible per-label data and intentional overrides; invalidated data produces structured diagnostics.
- **TASK-51:** Autosave, named snapshots, undo/redo, export registration, and print preparations retain relationships and resolved generation state without silent flattening.

## Acceptance criteria

- Two assignments of one template resolve different valid data without duplicating the stored template tree.
- Editing the template updates both instances while preserving instance values and compatible overrides.
- Independent content can coexist with template assignments on one page.
- Sparse selections and unavailable positions produce stable, documented placement over repeated runs and reloads.
- Multi-page preview and parsed PDF have identical page count and position ordering.
- Invalid data or overrides identify the affected template input and assignment.
- Template creation, data entry, assignment, reorder alternatives, preview, and pagination are keyboard operable and verified using Playwright.

## Conceptual data touched

`TemplateInputDefinition` includes name, type, default, constraints, and version. `PositionAssignment` is either a template instance with data/overrides or independent content. `PaginationPlan` contains ordered pages and source assignments and is derived deterministically. `LabelProject` and named snapshots preserve references.

## UI and accessibility principles

Data inputs expose type and validation. Position selection is a semantic grid/list with keyboard operation, announced availability, and non-pointer ordering alternatives. Page/position labels are stable and understandable without visual coordinates alone.

## Technical constraints

Data binding, resolution, ordering, and pagination are pure. Never persist evaluated code or flatten templates as an incidental save format. Prototype used-position skipping demonstrates feasibility only; production uses the shared scene.

## Prerequisites and access

Requires PRD 18. No services, secrets, accounts, environment variables, test users, or physical materials are required.

## Security, privacy, and performance

Treat all data values as untrusted text/typed values and never interpolate into executable contexts. Resolve only assignments needed for visible pages when useful, but maintain deterministic results. Large sheets and multi-page projects must show progress rather than freeze; numeric budgets await profiling.

## Assumptions and non-goals

Spreadsheet import, cloud data sources, executable formulas, and public template plugins are out of scope. Used-position persistence for physical sheets arrives in PRD 23. This PRD also supports PRDs 20 and 24.

## Milestone

Complete when template relationships, sparse assignments, mixed content, snapshots, reload, deterministic pagination, browser behavior, and artifact parity pass.