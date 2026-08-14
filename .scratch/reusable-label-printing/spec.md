# Reusable Label Printing Application

Label: ready-for-agent

## Problem Statement

People using ordinary desktop printers cannot reliably place reusable content onto adhesive label sheets from a browser. Published product dimensions, browser previews, and nominal printer settings do not establish where ink will land on a physical sheet. Browser code cannot discover the physical printer, inspect or enforce print-dialog choices, load media, measure output, or confirm that printing occurred. Existing browser-print approaches also tend to couple content to live DOM, lose settings between sessions, mishandle partially used sheets, and imply accuracy that has not been physically demonstrated.

The user needs a personal, web-based tool that remembers sheet layouts, printing setups, label content, and past preparation choices; provides a responsive visual editor; produces deterministic PDF printable output at an explicit physical page size; and states clearly which conclusions come from software validation versus physical evidence. The tool must remain useful when hardware details are incomplete, while refusing unsupported alignment, suitability, or safe-refeeding claims.

## Solution

Build a production-quality, local-first desktop-browser application as a static React, TypeScript, and Vite PWA. It requires no account or application server and stores versioned records and assets in IndexedDB with complete export, import, migration reporting, and deletion.

The application lets the user create immutable sheet-layout revisions for uniform grids of square- or rounded-rectangle labels; create reusable label content templates from application-owned components; assign template data or independent content to label positions; track used positions; preview content at label and sheet scale; validate rounded safe areas and content insets; and generate deterministic PDF printable output from a shared framework-neutral scene rather than captured DOM.

The application records printing setups and print configurations without pretending to detect or control them. Printer profiles bind to an exact printing setup and sheet-layout revision. Compatibility is centrally checked before output generation, and the operator reconfirms unknown or unobservable physical assumptions. With no physical validation materials currently known, the first implementation may generate explicitly uncalibrated printable output and establish evidence-aware calibration schemas and refusal paths, but it must not claim a validated alignment tolerance, suitable printing setup, physically verified sheet layout, feed consistency, or validated correction beyond the documented translation-first policy.

## User Stories

### Application access and ownership

1. As a label author, I want to use the application in a desktop browser, so that I do not need to install platform-specific printing software.
2. As a label author, I want to install the application as a PWA, so that it feels like a focused personal tool.
3. As a label author, I want core authoring and PDF preparation to work offline, so that network availability does not block printing.
4. As a label author, I want to use the application without creating an account, so that my local printing workflow does not depend on a service.
5. As a label author, I want my records to survive browser restarts, so that I can resume past work.
6. As a label author, I want to export all records and assets, so that I control my backup.
7. As a label author, I want to import a previous export, so that I can recover or move my work.
8. As a label author, I want import failures and migrations reported explicitly, so that incompatible data is not silently discarded.
9. As a label author, I want to delete individual records or all local data, so that I remain in control of stored information.
10. As a keyboard user, I want every production workflow operable without a pointer, so that the application is accessible.
11. As an assistive-technology user, I want meaningful labels, focus order, status announcements, and error associations, so that I can understand and operate the application.

### Application workspace

12. As a label author, I want a home screen of recent label projects, so that I can resume work quickly.
13. As a label author, I want separate navigation for Projects, Sheet layouts, Printing setups and calibration, Assets, and Settings and backup, so that durable records are understandable.
14. As a label author, I want a project workflow organized as Content, Sheet, Preview, and Prepare PDF, so that authoring remains iterative rather than a one-way wizard.
15. As a label author, I want editors to autosave recoverable drafts, so that a browser interruption does not destroy work.
16. As a label author, I want undo and redo during an editing session, so that experimentation is reversible.
17. As a label author, I want named project snapshots at meaningful checkpoints, so that I can return to a known printable state.
18. As a label author, I want exports to include current state and named snapshots, so that backup preserves intentional history.

### Sheet layouts and catalog data

19. As a label author, I want to create a sheet layout from sheet dimensions, rows, columns, label dimensions, four outer margins, and horizontal and vertical gaps, so that the application represents my stock.
20. As a label author, I want to enter measurements as fractional imperial, decimal imperial, or metric values, so that I can use the units printed by the manufacturer or available on my measuring tool.
21. As a label author, I want the UI to display my preferred measurement system while geometry is normalized internally, so that editing remains familiar without compromising calculations.
22. As a label author, I want the application to derive exactly one missing dimension when the dimensional equations have a unique solution, so that I need not calculate it manually.
23. As a label author, I want derived values disclosed, so that I know which geometry I supplied and which geometry the application inferred.
24. As a label author, I want contradictory geometry rejected without silent adjustment, so that generated output does not conceal an invalid sheet layout.
25. As a label author, I want zero, known, estimated, and unknown label corner radii represented distinctly, so that square and rounded label boundaries are not confused.
26. As a label author, I want every geometry change to create a new sheet-layout revision, so that past printer profiles and print preparations remain auditable.
27. As a label author, I want an independently edited catalog layout to receive a new identity, so that my custom stock is not confused with the published product.
28. As a label author, I want catalog provenance, product identity, and physical-verification status shown separately, so that catalog inclusion is not mistaken for physical verification.
29. As a label author, I want to use a published-but-unverified sheet layout with a clear disclosure, so that missing physical evidence does not block all work.
30. As a label author, I want irregular or unsupported media refused rather than approximated, so that the application does not generate misleading geometry.
31. As a label author, I want a visual sheet-layout preview, so that rows, columns, gaps, margins, and rounded label boundaries can be checked before content authoring.

### Label content authoring

32. As a label author, I want to compose label content through application-owned components, so that content remains serializable and reproducible.
33. As a label author, I want text components with constrained typography, so that I can create readable labels.
34. As a label author, I want QR-code components, so that I can encode links or other data.
35. As a label author, I want locally imported images, so that printable content does not depend on external URLs.
36. As a label author, I want basic shape components, so that I can add visual structure.
37. As a label author, I want row, column, and stack layouts with alignment, gaps, and sizing controls, so that content responds to different label dimensions.
38. As a label author, I want an explicit overlay layer for elements requiring free positioning, so that exceptional layouts are possible without making all content brittle.
39. As a label author, I want sizing in physical lengths, percentages, flexible space, and intrinsic dimensions, so that components can be both precise and responsive.
40. As a label author, I want the application to reject arbitrary JavaScript, React modules, and raw persisted CSS, so that saved content remains safe, portable, and deterministic.
41. As a label author, I want a documented bundled font set, so that preview and PDF typography do not depend on fonts installed on one computer.
42. As a label author, I want imported assets included in backups, so that restored projects remain complete.
43. As a label author, I want to create a reusable label content template, so that many labels can share one composition.
44. As a label author, I want a label content template to accept per-label data, so that repeated labels can contain different values.
45. As a label author, I want optional per-label overrides, so that one instance can differ without duplicating the whole template.
46. As a label author, I want to assign unrelated content independently to any label position, so that a sheet need not use one template.
47. As a label author, I want a uniform content inset or independent per-side insets, so that content can stay farther from a label boundary for appearance or rounded-corner clearance.
48. As a label author, I want content inset applied inside the safe area rather than replacing alignment tolerance, so that aesthetic spacing does not erase physical safety allowance.

### Preview and validation

49. As a label author, I want a real-time label preview, so that I can see content respond while editing.
50. As a label author, I want a real-time sheet preview, so that I can inspect assignments and pagination across positions.
51. As a label author, I want preview zoom to scale an already-laid-out result without changing line breaks or component breakpoints, so that zoom does not alter printable content.
52. As a label author, I want label preview, sheet preview, and PDF output to derive from the same scene, so that they do not drift through separate layout implementations.
53. As a label author, I want the actual rounded label boundary visible, so that corner risk is apparent.
54. As a label author, I want the safe area computed from the rounded label boundary and alignment tolerance, so that validation reflects label shape.
55. As a label author, I want the content inset applied as a second inward reduction, so that user-selected clearance remains additive.
56. As a label author, I want safe-area violations displayed continuously and associated with the offending content, so that I can correct them before output generation.
57. As a label author, I want safe-area violations to block PDF preparation by default, so that accidental edge overflow is not silently accepted.
58. As an advanced label author, I want to override a safe-area refusal explicitly, so that intentional exceptions remain possible.
59. As a label author, I want every override recorded in the print preparation, so that generated output discloses its assumptions.
60. As a label author, I want an unknown corner radius to prevent a corner-safety claim without blocking editing, so that incomplete product data is handled honestly.

### Projects, positions, and partially used sheets

61. As a label author, I want a label project to save its sheet-layout revision, label content templates, per-label data, overrides, content insets, and position assignments, so that one labeling purpose can be resumed.
62. As a label author, I want a label project to reference a printing setup and printer profile rather than copy them, so that compatibility remains centrally evaluated.
63. As a label author, I want to select any available positions for output, so that I can skip used positions.
64. As a label author, I want deterministic pagination when assignments exceed one sheet, so that position order is predictable.
65. As a label author, I want to create a named sheet instance for one identifiable physical label sheet, so that used positions can be remembered across sessions.
66. As a label author, I want a sheet instance bound to its exact sheet-layout revision, so that used positions are not applied to incompatible geometry.
67. As an operator, I want a reused sheet instance to require renewed inspection and confirmation of loading procedure and leading edge, so that stored state is not mistaken for safe refeeding.
68. As an operator, I want a persistent warning that the application does not establish whether a partially used sheet is mechanically safe to refeed, so that I retain responsibility for the physical decision.

### Printing setups and compatibility

69. As an operator, I want to name a printing setup and enter whatever printer, operating-system, driver, browser, connection, feed, and media details I know, so that future output can reference the same real-world conditions.
70. As an operator, I want unknown printing-setup details stored explicitly, so that missing information is not guessed.
71. As an operator, I want to record a loading procedure with feed source, leading edge, and printable-face direction, so that media can be loaded consistently.
72. As an operator, I want to record a print configuration with paper size, scale, orientation, media type, feed source, duplex state, and page decorations, so that unobservable dialog choices are documented.
73. As an operator, I want the application to explain that it cannot inspect my physical printer or print-dialog values, so that confirmation is not mistaken for automation.
74. As an operator, I want a setup attestation when unknown details prevent automatic matching, so that profile reuse is an explicit human decision.
75. As an operator, I want to reconfirm loading procedure and print configuration before preparing final output, so that changed assumptions are surfaced.
76. As an operator, I want one authoritative profile-compatibility result with structured reasons, so that every workflow explains incompatibility consistently.
77. As an operator, I want a printer profile rejected when its sheet-layout identity, revision, or canonical geometry fingerprint differs, so that calibration is not applied to changed stock.
78. As an operator, I want contradictory changes to a printing setup, loading procedure, or print configuration to require a different setup or recalibration, so that a profile is not silently reused.
79. As an operator, I want additional previously unknown metadata to be recordable without automatically discarding valid observations, so that setup identification can improve over time.
80. As an operator, I want uncalibrated output clearly disclosed when no compatible printer profile exists, so that lack of correction is visible.

### Calibration and evidence boundaries

81. As an operator, I want calibration represented as an explicit serializable workflow, so that progress can be restored without bypassing validation.
82. As an operator, I want invalid calibration transitions refused with actionable reasons, so that steps cannot be silently skipped.
83. As an operator, I want illustrative or demo observations kept separate from physical calibration observations, so that synthetic data cannot create a usable printer profile.
84. As an operator, I want a calibration sheet with an explicit physical PDF page size and measurement marks, so that software can provide a controlled artifact.
85. As an operator, I want physical observations to retain provenance, sample count, assumptions, and diagnostics, so that a printer profile remains auditable.
86. As an operator, I want one-sheet calibration results described as preliminary, so that placement bias is not confused with placement variation.
87. As an operator, I want repeated physical observations required before feed-consistency or suitability conclusions, so that claims reflect variation.
88. As an operator, I want the initial correction model limited to whole-sheet horizontal and vertical translation, so that unproven complexity does not conceal unstable output.
89. As an operator, I want scale or rotation deferred until repeated evidence shows stable residual structure translation cannot explain, so that added parameters remain evidence-driven.
90. As an operator, I want printer profiles to disclose applied parameters and suitability verdicts, so that correction behavior is visible.
91. As an operator, I want the application to withhold suitability and alignment-tolerance claims while physical validation materials are unavailable, so that software feasibility is not presented as physical proof.

### Printable output and print preparations

92. As a label author, I want deterministic PDF printable output with an explicit physical page size, so that browser print CSS is not the controlled geometry artifact.
93. As a label author, I want fonts embedded or outlined in the PDF, so that output does not change with installed fonts.
94. As a label author, I want images and QR geometry included from local deterministic assets, so that output does not depend on a network request.
95. As a label author, I want millimetres converted to PDF points only at the rendering boundary, so that domain calculations use one coordinate system.
96. As a label author, I want correction applied consistently to calibration marks and final label content, so that translation signs and axes do not diverge.
97. As a label author, I want selected positions and used positions honored in deterministic order, so that output matches the sheet preview.
98. As a label author, I want generation diagnostics returned with PDF bytes, so that missing fonts, unresolved assets, overflow, and compatibility problems can be explained.
99. As a label author, I want a print preparation saved for every generated PDF, so that I can inspect how it was produced.
100. As a label author, I want a print preparation to include a project snapshot, output hash, timestamp, sheet-layout revision, selected positions, printer-profile identity, compatibility result, setup attestation, print configuration, overrides, and diagnostics, so that generation is reproducible and auditable.
101. As an operator, I want downloading or opening a PDF to remain distinct from physically printing it, so that application history does not assert an event it cannot observe.
102. As an operator, I want the application to leave printer selection and dialog handling to me, so that it does not imply control the browser does not provide.

## Implementation Decisions

1. **Product and deployment**: Implement a standalone application before considering npm-package extraction. Use React, TypeScript, Vite, and installable PWA support. Deploy static assets with no required account or application server. Target ordinary evergreen desktop browsers across Windows, macOS, and Linux without claiming an untested support matrix.

2. **Private architecture**: Keep private inward-pointing boundaries for sheet-layout geometry, calibration and compatibility, label-content layout, printable-scene generation, PDF rendering, IndexedDB persistence and migration, and React application features. These are internal correctness and testing seams, not frozen public package APIs.

3. **Pure domain behavior**: Geometry, calibration transitions, profile compatibility, label-content layout, pagination, and printable-scene generation operate on versioned serializable values and do not import React, DOM, browser-storage, or PDF-library APIs.

4. **Sheet-layout schema**: A sheet layout has a stable identity and immutable revisions. A revision records sheet dimensions, row and column counts, uniform label dimensions, four independent outer margins, uniform horizontal and vertical gaps, and a label corner radius that may be zero, known, estimated, or explicitly unknown. It also records provenance, product identifiers, physical-verification status, derived-value disclosures, and a canonical geometry fingerprint.

5. **Sheet-layout validation**: Normalize geometry to millimetres. Accept fractional-imperial, decimal-imperial, and metric input through UI parsing. Validate the dimensional equations without silent correction. Derive a value only when exactly one missing value has one valid solution. Reject negative, non-finite, contradictory, overlapping, out-of-sheet, or unsupported geometry. Corner radius cannot exceed half the smaller label dimension.

6. **Supported media**: The first model supports uniform grids of axis-aligned square- or rounded-rectangle label boundaries on rectangular sheets. Circular, oval, arbitrary die-cut, roll, thermal, continuous, and duplex media are excluded.

7. **Catalog separation**: Catalog and user-created sheet layouts use the same revision schema. Catalog provenance and product identity do not imply physical verification. Editing a catalog layout creates a new identity; editing any geometry creates a new revision.

8. **Label-content schema**: Persist a versioned declarative component tree. Initial elements are text, image, QR code, basic shapes, row, column, stack, and overlay. Persist constrained properties for physical lengths, percentages, flexible space, intrinsic sizing, typography, alignment, gaps, and overlay coordinates. Do not persist raw CSS or executable code.

9. **Templates and assignments**: A label content template contains a component tree and named data slots. A label project may instantiate a template with per-label data and optional overrides or assign unrelated content directly to a position. Assets are referenced by durable local identifiers.

10. **Assets and fonts**: Copy imported images into IndexedDB and include them in exports. Do not make durable printable output depend on external image URLs. Ship a documented font set and embed or outline used glyphs in PDF output. Defer custom font import.

11. **Shared printable scene**: The serialized label-content tree is authoritative. Resolve it against physical label dimensions, safe area, content inset, assets, and per-label data into one framework-neutral printable scene. React/SVG label previews, sheet previews, validation overlays, and PDF rendering consume that same scene. Do not capture arbitrary DOM as printable source.

12. **Responsive layout**: Layout responds to the physical content region. Preview size and zoom are post-layout display transforms and cannot change wrapping, breakpoints, or component positions. Flow layout is the default; free positioning exists only within explicit overlay containers.

13. **Safe-area calculation**: Compute the safe area as the inward offset of the rounded label boundary by the requested alignment tolerance. Apply content inset as an additional inward offset. Validate rendered scene geometry against the final rounded region. Unknown corner radius permits work but prevents a corner-safety conclusion.

14. **Overflow policy**: Safe-area violations block printable-output generation by default. An advanced user may explicitly override the refusal. Record each violation and override in the print preparation; an override does not establish physical safety.

15. **Label projects**: Persist project identity, name, selected sheet-layout revision, template references, per-label data and overrides, independent position content, content insets, assignments, printing-setup and printer-profile references, autosaved draft, and named snapshots. Keep session undo/redo transient.

16. **Sheet instances**: A sheet instance identifies one physical label sheet, binds to one sheet-layout revision, and records used positions and optional notes. It is a passive record and never claims that refeeding is safe. Require renewed operator confirmation before reuse.

17. **Printing setups**: Persist a stable user-named identity plus known or explicitly unknown printer, operating-system, driver, browser, connection, media, and feed details. Persist loading procedure and print configuration as separately revisioned assumptions. Browser code does not discover or verify the physical printer or dialog values.

18. **Printer profiles**: A printer profile binds to an exact printing setup, loading-procedure revision, print configuration, sheet-layout identity and revision, and canonical geometry fingerprint. It carries calibration-observation provenance, sample count, diagnostics, suitability language, and applied parameters. The production correction schema initially supports whole-sheet horizontal and vertical translation only.

19. **Compatibility authority**: Implement one pure compatibility operation used by restored drafts, profile selection, preview, and final generation. It returns a structured result containing status, incompatibility reasons, required confirmations, and whether recalibration is required. Unknown setup fields are not wildcards. Setup attestation permits an operator to confirm sameness when automatic inspection is impossible; contradictory known values remain incompatible.

20. **Calibration workflow**: Represent layout selection, printing-setup identification, print-configuration confirmation, calibration generation, plain-paper inspection, physical observations, profile derivation, profile saving, content validation, and final generation as explicit serializable states and validated transitions. Restoring a draft reruns invariants. Demo data and software-only checks cannot satisfy physical-evidence gates.

21. **Physical-evidence gate**: No physical materials are currently known. Do not encode provisional numeric thresholds from the prototype as production policy. One-sheet results are preliminary. Repeated physical observations are required for placement-variation, suitability, or higher-confidence claims. Scale and rotation are not implemented or selected unless later repeated evidence justifies reopening the model.

22. **Uncalibrated mode**: Permit deterministic PDF generation without a printer profile when all software validations pass. Clearly label it uncalibrated, apply no correction, save that status in the print preparation, and make no alignment or suitability claim.

23. **PDF boundary**: The PDF renderer accepts a validated printable scene plus explicit page geometry and an optional compatible translation profile. It returns deterministic PDF bytes and structured diagnostics. Contain PDF-library types, font embedding, asset encoding, and browser download/open behavior outside domain modules.

24. **Coordinates and ordering**: Use millimetres and one documented sheet coordinate system throughout domain calculations. Convert to points only in the PDF renderer. Define position ordering once and reuse it for assignments, used positions, preview, pagination, and output. Apply correction signs consistently to calibration and final output.

25. **Print preparations**: Save an immutable record on each successful PDF generation containing the exact project snapshot, output hash, timestamp, sheet-layout revision and fingerprint, selected positions, optional sheet instance, optional printer profile, compatibility result, setup attestation, print configuration, uncalibrated status, overrides, and generation diagnostics. Do not record PDF download as a confirmed physical print.

26. **Persistence**: Use IndexedDB for all versioned domain records and binary assets. Use repositories at the application boundary rather than one global mutable store. Use feature-level state for active editors and local React state for presentation details.

27. **Migration and portability**: Define one versioned export bundle containing records, assets, schema metadata, and named snapshots. Validate before import, report every migration or incompatibility failure, and avoid partial silent drops. Support explicit record deletion and complete local-data deletion.

28. **Application shell**: Provide top-level Projects, Sheet layouts, Printing setups and calibration, Assets, and Settings and backup destinations. Within a project, provide Content, Sheet, Preview, and Prepare PDF. Calibration is launched when needed rather than forced into every project.

29. **Accessibility**: Use semantic controls, visible focus, logical keyboard order, accessible drag alternatives, labeled measurement inputs, announced validation state, and non-color-only indicators. All editor actions, position assignment, override confirmation, export/import, and PDF preparation must be keyboard operable.

30. **PWA updates**: Cache the application shell and static bundled assets for offline use, but do not overwrite open work during a service-worker update. Surface update readiness and activate a new version only through a controlled reload after drafts are durable.

31. **Prototype treatment**: Use the browser PDF calibration prototype as feasibility and interaction evidence only. Do not lift its ad hoc PDF writer, fake QR marks, local-storage boundary, dual layout sources, heuristic thresholds, incomplete invalidation, or partial rotation implementation into production.

32. **Package extraction**: Do not publish or design a public npm API during this implementation. Reevaluate extraction only after the production application is accepted and a second concrete consumer identifies genuinely reusable behavior.

## Testing Decisions

1. **Primary seam**: The highest acceptance seam is the running PWA through its public user interface and downloadable/exportable artifacts. Browser-level tests should create or import records, author content, preview a sheet, exercise refusals and overrides, generate PDF bytes, restart the application, and export/import state. Assertions target visible behavior, persisted records, structured diagnostics, and artifact properties—not React components, reducers, IndexedDB table layout, or library calls.

2. **Why supporting seams remain necessary**: Browser code cannot observe physical output, and byte-level PDF and geometric invariants are expensive to diagnose only through UI tests. Add the minimum supporting contract tests at pure boundaries: validated sheet layout, compatibility result, printable scene, calibration transition result, PDF result, and versioned export/import result. These boundaries were already reviewed and accepted during design.

3. **Geometry contract tests**: Test fractional and decimal imperial parsing, metric input, millimetre normalization, unique derivation, contradictory equations, negative and non-finite values, rounded-corner limits, out-of-sheet geometry, immutable revision behavior, and deterministic fingerprints. Use representative fixtures but do not mark published dimensions physically verified.

4. **Printable-scene contract tests**: Given a sheet-layout revision, component tree, data, asset metadata, alignment tolerance, and content inset, assert final scene geometry, wrapping, flexible sizing, deterministic position order, rounded safe-area violations, unknown-radius diagnostics, and independence from preview zoom. Test nested flow layouts and explicit overlays.

5. **Preview/PDF parity tests**: Render a canonical scene through SVG preview and PDF adapters and compare normalized scene-level bounds and text/image/QR placements. Do not use screenshot identity as the only oracle. Verify that the same scene—not the DOM—is supplied to both renderers.

6. **PDF artifact tests**: Parse generated PDFs to verify exact page boxes, page count, deterministic pagination, stable hashes for identical normalized inputs, embedded or outlined fonts, resolved assets, coordinate signs, translation application, and structured diagnostics. Generated page size proves PDF structure only, never physical scale or placement.

7. **Compatibility tests**: Cover exact matches, layout revision and fingerprint mismatches, changed print configuration, changed loading procedure, contradictory setup details, newly supplied non-contradictory metadata, unknown fields, setup attestation, missing profiles, and uncalibrated generation. Assert structured explanations and required next actions.

8. **Calibration state-machine tests**: Exercise every valid transition and refusal, out-of-order transitions, invalid observations, draft restoration, profile invalidation, one-sheet preliminary language, repeated-evidence gates, demo-data separation, and final-generation refusal. Do not test unvalidated numerical suitability thresholds.

9. **Persistence integration tests**: Run against real IndexedDB behavior in a browser. Round-trip every durable record and binary asset, reopen after restart, verify referential integrity, test deletion, and ensure transient undo/redo and preview zoom are not accidentally durable.

10. **Migration and backup tests**: Maintain versioned export fixtures. Test complete export, clean import, older-version migration, duplicate identities, corrupt assets, unsupported future versions, transactional rollback, user-visible reports, and no silent partial loss.

11. **Project and sheet-instance tests**: Cover autosave recovery, named snapshots, per-position assignments, template data and overrides, deterministic skipping of used positions, layout-revision incompatibility, and renewed reuse confirmation. Never assert that a saved sheet instance is physically safe.

12. **Accessibility tests**: Combine automated accessibility checks with keyboard-driven browser tests for all primary flows. Verify focus restoration after dialogs, announcements for validation and generation status, accessible alternatives to pointer positioning, and readable non-color-only warnings.

13. **Offline and update tests**: Verify first-load installation, subsequent offline startup, local editing, preview, PDF generation, export, and controlled service-worker update without draft loss. Network failure must not break local assets or bundled fonts.

14. **Refusal-path tests**: Verify the application does not expose printer discovery, silent printing, print-dialog inspection, arbitrary code execution, live DOM capture, implicit profile reuse, unsupported media approximation, physical-verification claims from catalog data, safe-refeeding claims, or suitability claims without evidence.

15. **Physical tests**: Do not fabricate them. Once physical materials are identified, add a separate protocol for measured sheet geometry, repeated uncalibrated output, placement bias, placement variation, feed consistency, and browser/driver combinations. Keep those results outside automated software evidence unless the measurements are operator-entered physical observations with provenance.

16. **Prior art**: There is no production code or existing automated test suite in this repository. The browser PDF calibration prototype supplies behavioral examples for state gating, deterministic page boxes, measurement entry, used-position pagination, and evidence separation, but it is not a production fixture and its heuristic constants are not expected values.

17. **Definition of a good test**: A good test observes a user-visible outcome, durable domain result, refusal, diagnostic, or generated artifact through the highest practical seam. It remains valid if internal functions, state libraries, storage schema layout, PDF library, or React component structure change while behavior remains the same.

## Out of Scope

- Publishing, documenting, or stabilizing an npm package or public engine API.
- First-party Vue, Angular, or other framework adapters.
- Accounts, authentication, required server storage, cloud backup, or cross-device synchronization.
- Arbitrary user-authored React components, JavaScript execution, raw persisted CSS, or a public plugin system.
- Custom font import in the first production implementation.
- Reliance on external image URLs for durable printable content.
- Mobile-browser support.
- Direct printer communication, printer discovery, silent printing, print-dialog inspection or control, and confirmation that physical printing occurred.
- Roll, thermal, continuous, duplex, circular, oval, non-uniform-grid, or arbitrary die-cut media.
- Automatic determination that a partially used sheet is mechanically safe to refeed.
- Scale, rotation, skew, local warping, or per-label calibration corrections without later repeated physical evidence.
- A universal alignment tolerance, suitable-printing-setup claim, physically verified catalog, supported-printer list, validated desktop-browser matrix, or feed-consistency claim while physical validation materials remain unavailable.
- Treating preview appearance, PDF page dimensions, published product dimensions, configured printer queues, synthetic measurements, or operator-unverified metadata as physical evidence.
- Final production thresholds or suitability policy copied from prototype heuristics.

## Further Notes

- The implementation must use the canonical language in the domain glossary, particularly sheet layout, sheet-layout revision, label boundary, safe area, content inset, printing setup, print configuration, loading procedure, printer profile, placement bias, placement variation, setup attestation, profile compatibility, sheet instance, print preparation, and physical verification.
- The product decision is application-first. References in older research or issues to package ownership, headless React adapters, or host-owned persistence are historical and superseded by the standalone-application ADRs.
- The accepted testing seams have already been reviewed in the completed design discussion: pure workflow transitions, one shared framework-neutral printable scene, a centralized compatibility operation, repositories over IndexedDB, and one isolated PDF renderer.
- Physical inventory is intentionally unknown. The physical baseline, evidence-based correction-model expansion, and final calibration-journey validation remain blocked until a real printer, identified label stock, measuring tools, and repeated fresh sheets are available.
- Implementation should proceed in tracer order: application shell and persistence foundation; sheet-layout geometry; label-content schema and scene generation; previews and validation; projects and position assignment; deterministic PDF generation and print preparations; printing-setup and compatibility behavior; evidence-aware calibration scaffolding; export/import, offline hardening, accessibility, and production polish.
- Completion of this specification does not resolve the physical-validation prerequisite and must not be presented as proof of print alignment.
