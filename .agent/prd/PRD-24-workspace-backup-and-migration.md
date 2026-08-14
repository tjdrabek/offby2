# PRD 24 — Back up, restore, migrate, and delete the complete workspace

## Source and status

- Source: [Issue 24](../../.scratch/reusable-label-printing/issues/24-workspace-backup-and-migration.md)
- Status: ready for implementation
- Dependencies: PRDs 15, 18, 19, 21, 22, and 23
- Governing decision: [ADR-0003](../../docs/adr/0003-keep-the-web-application-local-first.md)

## Overview

Give users a complete, versioned, inspectable, offline backup and recovery path for every durable record, named snapshot, and asset. Import validates the whole candidate before committing, reports migrations and incompatibilities, and rolls back on failure. Users can delete individual records with dependency explanations or delete all local application data.

## Objectives and success criteria

- Make user-owned export/import the first-release recovery mechanism.
- Prevent silent partial import and hidden data loss.
- Keep migration and integrity outcomes explicit and testable.
- Register every durable feature with export, import, deletion, and migration behavior.
- Succeed when current/older fixture round trips, corruption, future versions, duplicate IDs, rollback, and referential integrity pass.

## User flow

A user opens Settings and backup, exports the complete workspace offline, inspects a summary, imports into a clean browser, reviews validation/migration results before commit, recovers all records/assets, deletes a dependent record with explanation, or confirms complete local-data deletion.

## Functional requirements

- **TASK-84:** Define one versioned export bundle containing all implemented durable records, named snapshots, referenced assets, schema metadata, integrity metadata, and export metadata.
- **TASK-85:** Export produces a complete user-downloadable bundle offline and reports included counts, versions, and integrity result.
- **TASK-86:** Import parses and validates the entire bundle before any durable mutation and presents an actionable pre-commit report.
- **TASK-87:** Reports identify migrations, duplicate identities, missing/corrupt assets, unsupported future versions, incompatible records, and referential-integrity failures.
- **TASK-88:** Commit occurs transactionally; any failure leaves the existing workspace unchanged and reports rollback.
- **TASK-89:** A clean browser import reproduces projects, normalized scenes, snapshots, assets, sheet instances, setups, profiles, preparations, and calibration drafts implemented by that release.
- **TASK-90:** Individual deletion explains dependents and applies an explicit policy; complete deletion requires confirmation and removes all application-owned IndexedDB/cache data without claiming downloaded backups are deleted.
- **TASK-91:** Versioned fixtures and browser tests cover round trips, older migrations, corruption, future versions, rollback, deletion, offline behavior, and mandatory registration of future durable record types.

## Acceptance criteria

- Export references resolve to included records/assets or produce a blocking internal integrity error.
- Import makes no durable changes before validation and explicit confirmation.
- Failed commit preserves byte/logical equivalence of pre-import durable state.
- Current export imported into a clean context reproduces records, relationships, scene inputs, and known PDF hashes.
- Unsupported future schemas are refused without partial salvage disguised as success.
- Individual and total deletion clearly state consequences; complete deletion is recoverable only from a user-owned export.
- Export, report review, import, rollback, and deletion are keyboard operable and verified using Playwright.

## Conceptual data touched

`WorkspaceBundle` contains schema version, records grouped by versioned type, binary assets, integrity manifest, and metadata. `ImportPlan` contains migrations, conflicts, errors, warnings, and proposed counts. `ImportResult` records atomic success/failure without secrets. Each repository exposes application-owned portability participation.

## UI and accessibility principles

File controls have clear labels and keyboard paths. Long validation/import/export shows progress and completion announcements. Reports use headings/lists, associate errors with affected records, and do not rely on color. Confirmation defaults safe and focus restores correctly.

## Technical constraints

No account, backend, cloud storage, or server recovery. Validate before transaction. Do not silently drop unknown records or assets. Export current state and named snapshots, but not transient undo history/zoom. Prototype local-storage serialization is not the production boundary.

## Prerequisites and access

Depends on all listed durable entities. No external service, secret, account, test user, environment variable, or network is required. Browser file download/upload capability and IndexedDB are sufficient.

## Security, privacy, and performance

Treat imported bundles as untrusted: bound sizes/counts, validate types and hashes, reject executable content and unsafe paths, and avoid decompression/resource exhaustion. Never upload bundles. Large operations need progress and recoverable cancellation/failure without UI lockup; numeric limits require measured representative workspaces.

## Assumptions and non-goals

Cloud backup, sync, merge between two active workspaces, and secret export are out of scope. This PRD unblocks PRD 28 and must later include PRD 25 calibration drafts.

## Milestone

Complete when complete offline round trips, migration reports, atomic rollback, deletion controls, accessibility, hostile-input tests, and browser acceptance pass.