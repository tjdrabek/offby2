# Reusable Label Printing — PRD portfolio

## Executive summary

Reusable Label Printing is a personal, local-first desktop-browser application for authoring content on uniform rectangular label sheets and producing deterministic PDF printable output. It preserves sheet-layout revisions, label projects, reusable content, local assets, printing-setup assumptions, sheet instances, calibration drafts, and print preparations in IndexedDB without requiring an account or server. Users own recovery through complete export/import.

The product explicitly separates software validation from physical evidence. Preview and PDF geometry can prove deterministic software structure but cannot prove where ink lands. The browser cannot identify or control a printer, inspect print-dialog choices, load media, measure output, determine safe refeeding, or confirm printing. Until real equipment and repeated observations establish policy, output remains visibly uncalibrated and no alignment tolerance, suitable printing setup, physical verification, feed consistency, or validated correction is claimed.

This portfolio turns implementation issues 14–28 into one PRD per ticket. PRDs are ordered by dependency but remain parts of one product. Accessibility is required in every UI slice and validated end to end in PRD 27. Behavioral performance requirements apply throughout; numeric budgets wait for representative profiling.

## Product objectives

1. Make deterministic label authoring and uncalibrated PDF preparation useful offline.
2. Preserve exact, versioned, serializable domain state and auditable preparation assumptions.
3. Render preview and PDF from one framework-neutral printable scene.
4. Keep all user data local and portable without a service dependency.
5. Refuse unsupported media, invalid geometry, unsafe assumptions, stale profiles, and evidence inflation with actionable reasons.
6. Keep all primary workflows keyboard and assistive-technology operable.

## Target audience

A desktop-browser label author or print operator managing reusable label projects and ordinary uniform-grid adhesive sheets. The initial product is a personal tool, not a commercial service. It targets evergreen desktop browsers on Windows, macOS, and Linux without claiming an untested compatibility matrix.

## Success criteria

- A user completes the full non-physical journey from project creation to deterministic uncalibrated PDF and backup recovery while offline after installation.
- Durable records and assets survive restart, update, export/import, migration, and recoverable failure.
- Equivalent normalized inputs produce equivalent printable scenes and byte-identical PDF output/hashes.
- Every compatibility, validation, and evidence decision returns structured reasons and appears consistently throughout the UI.
- Browser-level tests exercise public workflows; pure contract/artifact tests cover geometry, scenes, compatibility, calibration transitions, PDF structure, and portability.
- No serious automated accessibility violations remain in primary states, and documented keyboard/manual checks pass.
- No unsupported physical claim appears before PRD 26 and its physical prerequisites are genuinely completed.

## Portfolio index

| PRD | Objective | Dependencies | Requirement IDs | Gate |
|---|---|---|---|---|
| [14 — Application shell](PRD-14-local-first-application-shell.md) | Recoverable local-first PWA and project lifecycle | None | TASK-2–9 | Open |
| [15 — Sheet-layout revisions](PRD-15-sheet-layout-revisions.md) | Validated immutable uniform-grid geometry | 14 | TASK-10–18 | Open |
| [16 — Text label preview](PRD-16-text-label-preview.md) | Serializable text and shared scene previews | 15 | TASK-19–26 | Open |
| [17 — Deterministic PDF](PRD-17-deterministic-text-label-pdf.md) | Explicit-page PDF and print preparation | 16 | TASK-27–34 | Open |
| [18 — Rich content](PRD-18-rich-responsive-label-content.md) | QR, images, shapes, flow, overlay | 17 | TASK-35–43 | Open |
| [19 — Templates and pagination](PRD-19-template-data-and-pagination.md) | Data-bound templates and stable sheet filling | 18 | TASK-44–51 | Open |
| [20 — Rounded safe areas](PRD-20-rounded-safe-areas.md) | Rounded validation, inset, refusal, override | 18; 19 for full coverage | TASK-52–59 | Open; physical claims unavailable |
| [21 — Printing setups](PRD-21-printing-setups.md) | Setup assumptions and attestations | 14 | TASK-60–67 | Open |
| [22 — Compatibility](PRD-22-profile-compatibility-and-uncalibrated-output.md) | Central compatibility and zero-correction output | 15, 17, 21 | TASK-68–75 | Open |
| [23 — Sheet instances](PRD-23-partially-used-sheet-tracking.md) | Used positions without safe-refeeding claims | 19, 21, 22 | TASK-76–83 | Open |
| [24 — Backup and migration](PRD-24-workspace-backup-and-migration.md) | Complete transactional portability/deletion | 15, 18, 19, 21, 22, 23 | TASK-84–91 | Open |
| [25 — Calibration draft](PRD-25-evidence-gated-calibration-draft.md) | Evidence-safe draft state machine | 17, 21, 22; 24 integration | TASK-92–101 | Software open; physical conclusions gated |
| [26 — Translation profiles](PRD-26-validated-translation-profiles.md) | Evidence-backed whole-sheet x/y correction | 25 and issues 13, 07, 09 | TASK-102–109 | **Blocked by physical evidence** |
| [27 — Accessibility](PRD-27-accessible-complete-workflow.md) | End-to-end keyboard/AT validation | 20, 23, 25; all UI slices | TASK-110–117 | Open after workflows |
| [28 — Offline/recovery](PRD-28-offline-update-and-recovery-hardening.md) | Final non-physical release hardening | 24, 25, 27 | TASK-118–125 | Open after workflows |

`TASK-1` is reserved for prerequisite verification during later implementation-task generation. This portfolio defines requirements only; it does not generate `.agent/tasks.json` or detailed task specs.

## Shared architecture and technical stack

- Static React 19, TypeScript 6, and Vite 8 PWA.
- IndexedDB repositories for all durable records and binary assets.
- Versioned serializable domain values and pure operations for geometry, content layout, pagination, compatibility, and calibration transitions.
- One framework-neutral printable scene consumed by React/SVG previews and an isolated deterministic PDF renderer; no live DOM capture.
- Application-owned component registry; no arbitrary user JavaScript, React modules, raw persisted CSS, or public plugin API.
- Millimetres and one documented coordinate system in domain calculations; PDF points only at rendering boundary.
- Vitest/Testing Library for supporting contracts and Playwright for public browser acceptance.
- Standalone application first; no public npm-package API until proven behavior and a concrete second consumer exist.

## Prerequisites and access

### Verified software prerequisites

- Repository dependencies and scripts provide React, TypeScript, Vite, Vitest, Testing Library, Playwright, ESLint, and Prettier.
- Required local commands: dependency installation, development server, build, lint, and test scripts documented in the repository package manifest.
- Required browser capabilities: IndexedDB, service workers, file download/upload, SVG, and client-side binary generation.

### Services, access, and environment

- Database server: none; IndexedDB is browser-local.
- Authentication/login/test users: none.
- Third-party service accounts or dashboards: none.
- Required MCP servers or authenticated CLIs: none.
- Required environment variables: none. `.env.local` exists with no secret or fake variable values.
- Real secrets must never be written to PRDs, task specs, logs, chat, or committed files.

### Documentation

- [React documentation](https://react.dev/)
- [Vite documentation](https://vite.dev/)
- [MDN IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
- [MDN Service Worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)
- [Playwright documentation](https://playwright.dev/docs/intro)
- PDF, QR, image, font, PWA, and automated-accessibility library documentation must be added to the relevant PRD/handoff after libraries and licenses are selected.

### Open physical prerequisite gap

No printer, identified label stock, fresh-sheet inventory, measuring tools, observed geometry, or repeated physical observations are known. The approved decision is to proceed with PRDs 25–26 as specifications with explicit gates, while blocking profile derivation and all physical conclusions until source issues 13, 07, and 09 resolve. Synthetic/demo data cannot close this gap.

## Shared conceptual model

- `SheetLayout` and immutable `SheetLayoutRevision`
- `LabelContentTemplate`, serializable content tree, data definitions, and position assignments
- `AssetRecord` and derived `PrintableScene`
- `LabelProject`, autosaved draft, and named snapshots
- `PrintingSetup`, `LoadingProcedureRevision`, and `PrintConfigurationRevision`
- `PrinterProfile` and pure `CompatibilityResult`
- `SheetInstance` and per-preparation reuse confirmation
- immutable `PrintPreparation`
- `CalibrationDraft` and provenance-carrying `CalibrationObservation`
- versioned `WorkspaceBundle`, `ImportPlan`, and migration results

Definitions and claims boundaries follow [CONTEXT.md](../../CONTEXT.md). Avoid replacing canonical terms with ambiguous synonyms.

## Shared security and privacy requirements

All content, hardware metadata, observations, and assets remain local unless the user explicitly exports them. Imported files and user input are untrusted and require schema, size, integrity, and resource validation. No arbitrary code executes. No external image/font dependency may be required for durable output. Operations must fail atomically or preserve last-known-good state. No telemetry or network transmission is required.

## Shared accessibility and performance requirements

Every UI PRD includes semantic controls, visible focus, keyboard alternatives, associated errors, announced status, and non-color-only warnings. PRD 27 validates the combined experience. Editing, preview, storage, and compatibility should remain responsive; long PDF/import/export operations require progress and recoverable failure. Numeric budgets are deferred until representative devices and data volumes are profiled.

## Non-goals

Accounts, authentication, backend storage, cloud backup/sync, mobile support, direct printer communication, printer discovery, silent printing, dialog inspection/control, physical-print confirmation, public plugins, arbitrary user code/CSS, custom fonts in the first release, external durable image URLs, non-uniform or non-rectangular media, automatic safe-refeeding decisions, and non-translation correction without later evidence are excluded.

## Milestones

1. Foundation: PRDs 14–17.
2. Rich authoring and validation: PRDs 18–20.
3. Printing assumptions and portability: PRDs 21–24.
4. Evidence-aware calibration: PRD 25; PRD 26 remains physically gated.
5. Release validation: PRDs 27–28.

## Assumptions and dependencies

The existing specification and ADRs are authoritative. ADR-0002 supersedes ADR-0001 only on package timing; the human/browser responsibility boundary remains valid. Competitive research is intentionally omitted because the product is currently a personal, non-commercial tool with no revenue model. Any scope change involving a server, account, new media model, or physical claim requires explicit product and architecture review.