# PRD 28 — Harden offline updates and the production recovery journey

## Source and status

- Source: [Issue 28](../../.scratch/reusable-label-printing/issues/28-offline-update-and-recovery-hardening.md)
- Status: ready after dependent workflows
- Dependencies: PRDs 24, 25, and 27

## Overview

Harden the complete non-physical product so it works offline after installation, survives controlled updates and recoverable failures, and restores into a fresh browser from a user-owned backup. The release must distinguish verified software behavior from untested platform combinations and physically blocked claims.

## Objectives and success criteria

- Complete core authoring, preview, uncalibrated preparation, and backup while offline.
- Activate updates only after drafts are durable and the user consents to controlled reload.
- Preserve existing records through write, storage, asset, generation, and import failures.
- Prove fresh-browser recovery reproduces normalized scenes, hashes, snapshots, instances, setups, and drafts.
- Succeed when one browser acceptance journey and all production quality gates pass.

## User flow

Install online once; create and edit a project; restart; go offline; preview and encounter/correct or override a safe-area refusal; attest setup; generate uncalibrated PDF; export; delete local data; import into a fresh context; recover equivalent output; respond safely to an announced update and simulated failures.

## Functional requirements

- **TASK-118:** After initial installation, offline users can start the app, open projects, edit content, preview sheets, prepare uncalibrated PDFs, and export backups using bundled assets/fonts.
- **TASK-119:** Service-worker updates are announced, never activate silently over active work, and reload only after drafts are verified durable and the user confirms.
- **TASK-120:** Interrupted writes and storage/quota failures return recoverable explanations and leave last-known-good records intact.
- **TASK-121:** Missing assets and failed PDF generation identify affected resources/work, preserve authoring state, and never create false successful preparations.
- **TASK-122:** Failed imports preserve existing state through validated transactional rollback and actionable reports.
- **TASK-123:** A fresh browser restores a complete backup and reproduces normalized scenes, PDF hashes, project snapshots, sheet instances, setups, and calibration drafts supported by the release.
- **TASK-124:** One Playwright acceptance journey covers creation, restart, offline use, refusal/override, setup attestation, preparation, export, deletion, import, recovery, update behavior, and keyboard operation.
- **TASK-125:** Release documentation separates tested software behavior, untested browser/platform combinations, and unavailable physical suitability/alignment/calibration claims; all quality gates pass.

## Acceptance criteria

- Network blocking after installation does not prevent the named core flow or cause external asset/font requests.
- An update cannot replace the running version until durable-state verification and explicit confirmation complete.
- Injected write/import/generation/resource failures preserve recoverable state and show no false success.
- A fresh context import yields equivalent normalized scene data and deterministic hashes for canonical fixtures.
- The acceptance journey passes using only public UI and downloadable/importable artifacts.
- Release checks include diff validation, type checking, linting, unit/contract tests, Playwright tests, accessibility checks, offline tests, and production build.
- Release copy makes no physical suitability, validated tolerance, feed consistency, safe-refeeding, supported-printer, or validated browser-matrix claim.

## Conceptual data touched

No new core entity is required. Recovery uses repository transactions, draft durability markers, bundle/import results, service-worker version/update state, and structured diagnostics. Release evidence records tested software combinations separately from domain records.

## UI and accessibility principles

Offline, saving, failure, recovery, and update states are persistent enough to understand, announced appropriately, and actionable by keyboard. Update prompts explain consequences, do not trap focus, and do not use manipulative defaults. Failure recovery never relies on console access.

## Technical constraints

Static PWA only; all core assets/fonts are bundled. Service worker must not cache user data as an alternate source of truth. IndexedDB repositories and versioned bundles remain authoritative. Prototype local storage is excluded.

## Prerequisites and access

Requires complete workflows through PRDs 24, 25, and 27. No backend, account, secret, environment variable, service, or test user is required. Browser offline/service-worker test capability is required. Physical materials are still unavailable; PRD 26 remains blocked.

## Security, privacy, and performance

Cache only application assets appropriate for offline use and avoid leaking user data through cache keys. Bound retries and storage operations. Offline startup, ordinary editing, and recovery statuses must remain responsive; long export/import/PDF operations require progress and recoverable failure. Numeric budgets follow measured baselines.

## Assumptions and non-goals

Offline means after a successful initial installation. This PRD does not promise every desktop browser/platform combination, background cloud sync, server recovery, or physical print results.

## Milestone

Final non-physical release gate. Complete when the production acceptance journey, fresh-context recovery, update/failure tests, accessibility, offline behavior, documentation boundaries, and all repository checks pass.