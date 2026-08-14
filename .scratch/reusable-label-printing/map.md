# Find the way to reliable reusable label printing

Label: wayfinder:map

Specification: [Reusable Label Printing Application](spec.md) (`ready-for-agent`)

## Destination

A production-quality standalone desktop-browser application that places user-controlled content on rectangular label sheets within documented alignment tolerances, backed by focused prototypes and physical evidence where equipment is available. After the production behavior is proven, evaluate whether demonstrated reusable capabilities should be extracted into an npm package and which application concerns should remain outside it.

## Notes

- Consult the `/domain-modeling` skill in every decision session and preserve the vocabulary in [CONTEXT.md](../../CONTEXT.md).
- Planning is the default until the production application scope and evidence requirements are settled.
- The internal engine is content-agnostic. QR-plus-text is representative validation content only.
- Build the best standalone application first. Preserve sensible private seams among geometry, calibration, compatibility, pagination, PDF generation, UI, and storage, but do not design speculative public package APIs.
- React, application workflow, presentation, and persistence may remain application-owned. Framework-neutrality and replaceable storage are package-extraction questions to revisit only after production behavior is proven and concrete consumers exist.
- Target ordinary desktop browser print dialogs. Do not claim that browser code can identify or control a physical printer unless research proves otherwise.

## Decisions so far

- [Establish browser printing constraints](issues/01-browser-printing-constraints.md) — Standard browser printing can express CSS layout and open the dialog, but printer discovery, dialog control, and physical-output guarantees remain outside page-script control.
- [Identify printer alignment variables](issues/02-printer-alignment-variables.md) — Calibrate only empirically stable setup-specific transforms, beginning with x/y translation; treat feed variation, loading, media, mechanics, and changed settings as tolerance or operator concerns.
- The controlled-geometry artifact is deterministic PDF printable output with an explicit physical page size; browser print CSS and preview are not physical evidence and cannot enforce downstream print configuration.
- Calibration is an application-domain-owned, explicit, serializable workflow. The human operator owns printer selection, dialog choices, loading, measurement, and attestation of physical observations.
- A printer profile belongs to an exact printing setup and carries its evidence, assumptions, sample count, diagnostics, suitability verdict, and applied parameters. Final printing requires reconfirming its loading procedure and print configuration.
- The initial correction model is whole-sheet x/y translation. Scale or rotation requires repeated physical observations showing stable residual structure that translation cannot explain; one-sheet results are preliminary.
- One revisioned sheet layout value must flow through calibration, printer-profile identity, preview, and final output. Compatibility rules must reject or invalidate a printer profile whenever a recorded assumption changes.
- Sheet layouts, printer profiles, label content packages, and persistence are separate serializable concerns. The standalone application stores them locally using its versioned persistence policy.
- Illustrative measurements, preview appearance, and generated PDF dimensions cannot unlock claims or behavior that require physical evidence.
- [Set the responsibility boundary](issues/06-package-responsibility-boundary.md) — Private domain modules own deterministic PDF planning and calibration semantics, the React application owns interaction and presentation, and the human and browser retain all physical and print-dialog control.
- [Define sheet layout semantics](issues/04-sheet-layout-semantics.md) — A sheet layout is an immutable revisioned uniform-grid geometry normalized to millimetres, while user-facing measurement systems, catalog provenance, physical verification, and calibration remain separate concerns.
- The application is desktop-platform agnostic across ordinary browsers on Windows, macOS, and Linux. Available equipment bounds physical evidence and claims, not application eligibility; incomplete printing-setup metadata is permitted with explicit unknowns and setup attestation on reuse.
- Build the standalone application before deciding whether to extract an npm package. Internal domain seams remain valuable for correctness and testing, but they are private implementation boundaries until real reuse requirements are known.
- The first product is a web-based personal tool that remembers printing setups, environment metadata, sheet-layout product data, printer profiles, label content, and physical-output preferences. It provides responsive real-time label and sheet previews and user-selectable content insets.
- [Define standalone application persistence](issues/05-persistence-contract.md) — The web application is local-first, stores versioned records and assets in IndexedDB without requiring an account, and includes complete export, import, migration reporting, and deletion from its first production release.
- Label content is a serializable component tree configured through the UI and rendered by application-owned React components; arbitrary user JavaScript is excluded. Responsiveness follows physical content dimensions rather than preview size.
- Label boundaries initially support square or rounded rectangular die cuts, including an explicitly unknown corner radius. Reusable label content templates support per-label data and overrides, responsive flow layout, a deliberate overlay layer, locally retained images, and deterministic bundled fonts.
- [Define sheet layout semantics](issues/04-sheet-layout-semantics.md) — Rounded label boundaries are revisioned geometry; safe areas and content insets follow the actual rounded shape, while unknown radii permit work without corner-safety claims.
- [Define the label-content authoring model](issues/11-label-content-authoring-model.md) — Serializable component trees and reusable templates drive a shared printable scene for responsive React/SVG preview and deterministic PDF output; arbitrary code, raw persisted CSS, and DOM capture are excluded.
- [Choose the standalone application architecture](issues/08-initial-module-architecture.md) — A static React/TypeScript/Vite PWA uses private inward-pointing modules, pure workflow transitions, IndexedDB repositories, and an isolated PDF renderer without prematurely defining package APIs.
- [Define the standalone application workspace](issues/12-standalone-application-workspace.md) — Label projects organize content and position assignments, optional sheet instances track used positions without claiming safe refeeding, and print preparations preserve generation evidence without claiming physical printing.
- [Inventory available validation equipment](issues/03-inventory-validation-equipment.md) — No physical printer, label stock, fresh-sheet count, measuring tools, or observed geometry are known; configured software and browser data establish no physical evidence.

The browser PDF calibration prototype established software feasibility for these decisions, not physical suitability. No alignment tolerance, suitable printing setup, browser matrix, feed-consistency claim, or physically verified sheet layout exists until issues 13 and 07 produce repeated physical observations.

## Not yet specified

- The supported desktop-browser matrix and defensible alignment-tolerance claims, once research and physical evidence exist.
- The physical baseline, correction model, and final calibration journey remain blocked until physical validation materials are identified or obtained.
- Whether an npm package should be extracted, and its public API or framework/storage boundaries, until the production application demonstrates reusable behavior and concrete consumers exist.
- The physical-validation protocol; the application specification and implementation tickets now define the software testing strategy and handoff boundary.

## Confirmed frontier

The standalone-application product direction and current evidence boundary were confirmed on 2026-08-14. The non-physical design frontier is complete. Issues 07, 09, and 10 remain intentionally blocked by issue 13; no physical baseline, correction-model validation, calibration-journey validation, alignment-tolerance claim, or suitable-printing-setup claim may be inferred before that prerequisite is resolved.

## Implementation tickets

The implementation graph is published with `ready-for-agent` status. Its initial software frontier is [14 — Create the recoverable local-first application shell](issues/14-local-first-application-shell.md).

- [15 — Create and revise a sheet layout](issues/15-sheet-layout-revisions.md)
- [16 — Author and preview a text label project](issues/16-text-label-preview.md)
- [17 — Generate deterministic text-label PDF output](issues/17-deterministic-text-label-pdf.md)
- [18 — Compose rich responsive label content](issues/18-rich-responsive-label-content.md)
- [19 — Fill sheets from reusable templates and per-label data](issues/19-template-data-and-pagination.md)
- [20 — Enforce rounded safe areas and content insets](issues/20-rounded-safe-areas.md)
- [21 — Record printing setups and operator confirmations](issues/21-printing-setups.md)
- [22 — Check profile compatibility and prepare uncalibrated output](issues/22-profile-compatibility-and-uncalibrated-output.md)
- [23 — Track partially used sheets without claiming safe refeeding](issues/23-partially-used-sheet-tracking.md)
- [24 — Back up, restore, migrate, and delete the complete workspace](issues/24-workspace-backup-and-migration.md)
- [25 — Run an evidence-gated calibration draft](issues/25-evidence-gated-calibration-draft.md)
- [26 — Derive and apply physically validated translation profiles](issues/26-validated-translation-profiles.md) — additionally blocked by the physical-evidence issues 13, 07, and 09
- [27 — Complete keyboard and accessibility validation](issues/27-accessible-complete-workflow.md)
- [28 — Harden offline updates and the production recovery journey](issues/28-offline-update-and-recovery-hardening.md)

## Out of scope

- Designing or publishing an npm package before the standalone application reaches an accepted production build.
- Speculative Vue or other framework integrations without a concrete consumer.
- Direct printer communication or automatic physical-printer identification.
- Mobile-browser, roll/thermal, continuous-media, duplex, and non-rectangular-label printing.
