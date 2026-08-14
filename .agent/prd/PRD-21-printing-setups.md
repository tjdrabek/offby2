# PRD 21 — Record printing setups and operator confirmations

## Source and status

- Source: [Issue 21](../../.scratch/reusable-label-printing/issues/21-printing-setups.md)
- Status: ready for implementation
- Dependency: PRD 14
- Governing decisions: [ADR-0001](../../docs/adr/0001-separate-domain-workflow-from-host-and-physical-printing.md), as superseded for package timing by [ADR-0002](../../docs/adr/0002-build-the-standalone-application-before-extracting-a-package.md)

## Overview

Let operators document known and explicitly unknown real-world printing conditions without implying that browser code inspected them. A printing setup has separately revisioned loading procedures and print configurations. Operator attestation and final reconfirmation make unobservable assumptions explicit before output preparation.

## Objectives and success criteria

- Represent incomplete setup metadata honestly.
- Distinguish stable setup identity, loading procedure, and print configuration.
- Permit non-contradictory refinement without treating unknowns as compatibility wildcards.
- Refuse silent mutation when known assumptions conflict.
- Succeed when persistence and browser tests cover incomplete data, revisions, contradictions, attestation, reconfirmation, and restart.

## User flow

An operator names a printing setup, enters known printer/OS/driver/browser/connection/media/feed details and marks others unknown, creates a loading procedure and print configuration, later adds compatible identifying detail, and explicitly attests/reconfirms conditions before preparation.

## Functional requirements

- **TASK-60:** Create and name a printing setup with known or explicit unknown printer, operating-system, driver, browser, connection, media, and feed fields.
- **TASK-61:** Store loading procedure as a revisioned entity containing feed source, leading edge, and printable-face direction.
- **TASK-62:** Store print configuration as a revisioned entity containing paper size, scale, orientation, media type, feed source, duplex state, and page-decoration choices.
- **TASK-63:** Permit additional non-contradictory metadata to refine setup identification while retaining provenance and previous unknown status.
- **TASK-64:** Contradictory known changes require a distinct setup or explicit recalibration path and never silently mutate assumptions referenced by profiles/preparations.
- **TASK-65:** Setup attestation is an explicit accessible operator action stating which unobservable assumptions are being confirmed.
- **TASK-66:** Final preparation requires explicit reconfirmation of the selected loading procedure and print configuration.
- **TASK-67:** The application exposes no printer discovery, silent printing, dialog inspection/control, or physical-print confirmation; tests verify language and refusal boundaries.

## Acceptance criteria

- Every optional identifying field distinguishes unknown from known-empty/known value.
- Editing a loading procedure or print configuration creates a new revision and preserves referenced history.
- Adding compatible detail does not retroactively claim automatic compatibility.
- A contradictory known value cannot overwrite referenced assumptions silently.
- Attestation/reconfirmation records exact setup and revision identities and lists what the browser cannot inspect.
- Data survives reload and remains editable through explicit revision actions.
- Setup creation, revision, attestation, and reconfirmation are keyboard operable and verified using Playwright.

## Conceptual data touched

`PrintingSetup` has stable identity, name, known/unknown metadata, and provenance. `LoadingProcedureRevision` and `PrintConfigurationRevision` are immutable assumptions. `SetupAttestation` references exact identities/revisions, actor action, timestamp, and disclosures without asserting automated verification.

## UI and accessibility principles

Use explicit “Unknown” controls rather than placeholder ambiguity. Explain loading orientation textually and visually. Attestation dialogs identify what is and is not confirmed, restore focus, and avoid coercive defaults. Status must not rely on color.

## Technical constraints

Browser environment information may be recorded only as disclosed metadata and is not proof of physical hardware or dialog choices. Domain comparison remains pure. The human operator owns printer selection, loading, dialog values, measurement, and physical action.

## Prerequisites and access

Requires PRD 14 persistence. No printer is required to implement and test record workflows. No backend, service, secret, environment variable, account, MCP authentication, or test user is required.

## Security, privacy, and performance

Setup metadata may identify local hardware and should remain local and export only on user action. Do not fingerprint or transmit it. Forms and comparison should remain responsive; no numeric budget is needed before profiling.

## Assumptions and non-goals

Automatic detection, printer lists, dialog control, silent printing, physical-print history, and suitable-setup claims are out of scope. This PRD unblocks PRDs 22, 23, and 25.

## Milestone

Complete when setup/revision contracts, persistence, explicit unknowns, contradiction handling, attestation disclosures, accessible browser flow, and tests pass.