# PRD 14 — Recoverable local-first application shell

## Source and status

- Source: [Issue 14](../../.scratch/reusable-label-printing/issues/14-local-first-application-shell.md)
- Status: ready for implementation
- Dependencies: none
- Governing decisions: [ADR-0002](../../docs/adr/0002-build-the-standalone-application-before-extracting-a-package.md), [ADR-0003](../../docs/adr/0003-keep-the-web-application-local-first.md), [ADR-0006](../../docs/adr/0006-build-a-static-react-pwa.md)

## Overview

Create the recoverable application foundation for a personal desktop-browser label tool. A label author can create and manage minimal label projects without an account or server, close the browser, and recover durable records. The shell establishes navigation, persistence, installation, offline startup, and safe update behavior used by every later PRD.

## Objectives and success criteria

- Provide an installable static React PWA with no required server.
- Keep user-owned records in versioned IndexedDB repositories.
- Recover projects after browser restart and ordinary interruption.
- Make navigation and project actions keyboard operable from the first slice.
- Consider the slice successful when browser tests prove create, rename, reopen, restart recovery, delete, installation readiness, and offline startup through visible behavior.

## Target audience

Desktop-browser label authors who want a private, durable personal tool. Keyboard and assistive-technology users are first-class users.

## Key user flow

1. Open the application and land on Projects.
2. Create and name a label project.
3. Rename or open it from recent projects.
4. Navigate among Projects, Sheet layouts, Printing setups and calibration, Assets, and Settings and backup.
5. Close and reopen the browser; recover the project.
6. Delete the project after an explicit confirmation.
7. Install the PWA, start it offline after initial installation, and receive a controlled update notice without losing an open draft.

## Functional requirements

- **TASK-2:** The shell exposes Projects, Sheet layouts, Printing setups and calibration, Assets, and Settings and backup as stable, semantically named destinations.
- **TASK-3:** A user can create, rename, open, list, and explicitly delete a minimal label project.
- **TASK-4:** Projects use versioned durable records stored through feature-oriented IndexedDB repositories and survive restart.
- **TASK-5:** The application detects recoverable project state and presents actionable recovery rather than silently discarding it.
- **TASK-6:** A web app manifest and service worker make the static application installable and permit offline startup after initial load.
- **TASK-7:** A pending service-worker update is announced and activates only through controlled reload after open drafts are durable.
- **TASK-8:** Primary navigation, project actions, confirmations, and recovery are keyboard operable with semantic names, logical focus, and visible focus.
- **TASK-9:** Browser-level tests verify the complete visible project lifecycle, restart recovery, deletion, installation readiness, and offline startup.

## Acceptance criteria

- A project created through the UI reappears with the same identity and name after a real browser-context restart.
- Rename and deletion persist; deletion requires confirmation and leaves no dangling minimal record.
- All five destinations are reachable by keyboard and identify the current destination programmatically.
- Starting offline after one successful online installation renders the shell and persisted projects without network errors.
- An available update never reloads automatically over an open, non-durable change.
- IndexedDB or storage failures produce a recoverable explanation and do not show a false success state.
- UI behavior is verified in a browser using Playwright; tests assert user-visible behavior rather than component internals.

## Conceptual data touched

- `LabelProject`: stable identity, name, schema version, created/updated timestamps, minimal recoverable state.
- `DraftStatus`: durable revision marker and recovery status; editor-specific content arrives in later PRDs.
- `ApplicationMetadata`: persistence schema version and controlled migration state.

## UI and accessibility principles

Use landmark navigation, headings, native buttons/links, explicit confirmation dialogs, visible focus, and status announcements. Avoid pointer-only menus. Empty, loading, storage-error, recovery, and offline states must explain the next action. PRD 27 performs complete-workflow validation but does not defer these baseline obligations.

## Technical constraints

React owns presentation; domain and persistence boundaries remain private. Use IndexedDB, not local storage, as the durable record boundary. Do not add accounts, auth, a backend, cloud sync, or a speculative public package. Updates must not mutate or discard open state behind the user.

## Prerequisites and access

- Existing React 19, TypeScript 6, Vite 8, Vitest, Testing Library, and Playwright toolchain is available.
- No database server, service account, MCP authentication, test user, environment variable, or secret is required.
- `.env.local` documents that no variables are currently required.
- Local setup: install dependencies, then use the repository build, lint, test, and development scripts.

## Security, privacy, and performance

All records remain local unless the user later exports them. Treat project names as private user data; do not transmit telemetry by default. Storage errors and quota limits must be surfaced. Project lists and navigation should remain responsive at representative local data volumes; numeric budgets are deferred until measurement, but startup and project actions must not cause avoidable main-thread lockups.

## Assumptions and non-goals

Assume an evergreen desktop browser with IndexedDB and service-worker support. Mobile support, server recovery, cross-device synchronization, physical printing, printer discovery, and package extraction are out of scope.

## Milestone and handoff

This is the first implementation milestone and unblocks PRDs 15 and 21. Completion requires passing type checking, linting, unit/integration tests, Playwright browser tests, and a production build.