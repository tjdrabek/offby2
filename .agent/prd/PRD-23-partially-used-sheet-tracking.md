# PRD 23 — Track partially used sheets without claiming safe refeeding

## Source and status

- Source: [Issue 23](../../.scratch/reusable-label-printing/issues/23-partially-used-sheet-tracking.md)
- Status: ready for implementation
- Dependencies: PRDs 19, 21, and 22

## Overview

Represent one identifiable physical label sheet as a sheet instance bound to an exact sheet-layout revision. Users can remember used positions and omit them from later output, but every reuse requires renewed operator inspection and loading confirmation, and the application must persistently disclaim mechanical refeeding safety.

## Objectives and success criteria

- Persist used positions for one named physical sheet without generalizing them to all stock.
- Apply one stable order and omission rule across preview, pagination, and PDF.
- Prevent incompatible layout selection.
- Require renewed physical decision-making on every reuse.
- Succeed when reload, sparse omission, incompatibility, confirmation, output, preparation, and warning accessibility are tested.

## User flow

A user creates a named sheet instance, binds it to a layout revision, records used positions and notes, selects it in a project, reviews persistent refeeding limitations, inspects the physical sheet, reconfirms leading edge/loading procedure, and prepares output omitting used positions.

## Functional requirements

- **TASK-76:** Create, rename, update notes for, and delete a sheet instance representing one physical label sheet.
- **TASK-77:** Bind each sheet instance to one exact immutable sheet-layout revision and store validated used-position identifiers.
- **TASK-78:** Project selection refuses an incompatible sheet-layout revision with a structured explanation.
- **TASK-79:** Preview, pagination, and PDF planning omit used positions deterministically using the canonical position order.
- **TASK-80:** Every reuse requires a fresh operator inspection confirmation, selected loading-procedure revision, and leading-edge confirmation.
- **TASK-81:** Relevant screens persistently state that the application cannot determine whether a partially used sheet is mechanically safe to refeed.
- **TASK-82:** Print preparation records sheet-instance identity, layout revision, used-position snapshot, and renewed confirmation.
- **TASK-83:** Persistence and tests prove no saved/reused instance creates a suitable-printing-setup, feed-consistency, or safe-refeeding claim.

## Acceptance criteria

- Used positions and notes survive restart and remain tied to one instance and exact revision.
- Incompatible instances cannot be silently selected or remapped.
- Preview and parsed PDF omit exactly the same used positions in stable order.
- A previous confirmation cannot satisfy a later reuse attempt.
- Preparation records the state and confirmation used at generation time even if the instance changes later.
- The safe-refeeding disclaimer remains visible and understandable throughout reuse.
- Creation, used-position editing, selection, confirmation, and preparation are keyboard operable and verified using Playwright.

## Conceptual data touched

`SheetInstance` contains identity, name, exact layout revision reference, used positions, notes, and timestamps. `SheetReuseConfirmation` is per preparation and references loading procedure, leading edge, inspected instance state, timestamp, and disclaimer acknowledgement.

## UI and accessibility principles

Used positions have semantic selected/used states and keyboard operation. Visual sheet markings have equivalent text. Confirmation never defaults to accepted, warns with text/icon, restores focus, and distinguishes “recorded” from “safe.”

## Technical constraints

Sheet instances are passive records, not safety models. Position omission reuses PRD 19 ordering. The browser cannot inspect sheet condition, loading, printer mechanics, or printing.

## Prerequisites and access

Requires templates/pagination (PRD 19), loading procedures (PRD 21), and preparation/compatibility (PRD 22). No physical sheet is required for software tests; tests use clearly synthetic records that do not count as evidence. No services, secrets, accounts, or environment variables are required.

## Security, privacy, and performance

Local notes may contain private information and remain local. Validate position identifiers against the exact revision. Omission calculations should be instantaneous for supported uniform grids.

## Assumptions and non-goals

The user owns physical identification and inspection. Automatic sheet recognition, mechanical safety determination, feed guarantees, and physical-print tracking are out of scope. This PRD unblocks PRDs 24 and 27.

## Milestone

Complete when durable exact binding, deterministic omission, renewed confirmation, immutable audit data, persistent disclaimers, and browser tests pass.