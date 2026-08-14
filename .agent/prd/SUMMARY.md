# Reusable Label Printing

Reusable Label Printing is a local-first static React PWA for creating label projects, modeling uniform rectangular sheet layouts, authoring serializable label content, previewing one shared printable scene, and generating deterministic PDF printable output. It requires no account or server and keeps versioned records and assets in IndexedDB with complete user-owned backup, migration, restoration, and deletion.

## Main features

- Immutable sheet-layout revisions with unit conversion, validation, provenance, and geometry fingerprints.
- Text, QR, local image, shape, flow-layout, and overlay content rendered through one preview/PDF scene.
- Reusable label content templates, per-label data/overrides, sparse positions, and deterministic pagination.
- Rounded safe-area validation, additive content insets, default generation refusal, and auditable override.
- Printing setups, loading procedures, print configurations, compatibility explanations, and uncalibrated zero-correction output.
- Sheet instances for tracking used positions without claiming safe refeeding.
- Evidence-gated calibration drafts and, only after physical validation, whole-sheet x/y translation profiles.
- Offline installation/use, controlled updates, accessible keyboard workflows, and complete backup recovery.

## Key user flows

1. Create/recover a project and select an exact sheet-layout revision.
2. Author content, assign positions, preview, resolve validation, and prepare deterministic uncalibrated PDF output.
3. Record setup assumptions and explicitly attest unobservable loading/configuration choices.
4. Track used positions on an identifiable sheet instance and reconfirm each reuse.
5. Export the complete workspace, delete local data, and restore into a clean browser.
6. Run a calibration draft without allowing demo/software evidence to create a profile.

## Key requirements

- No backend, account, cloud dependency, arbitrary user code, DOM capture, or external durable assets.
- Millimetres are authoritative in domain calculations; PDF points are used only at the renderer boundary.
- Preview and PDF consume the same framework-neutral printable scene.
- Every primary flow is keyboard and assistive-technology operable.
- Browser limitations and operator responsibilities are explicit.
- No alignment, suitability, physical-verification, feed-consistency, or safe-refeeding claim exists without qualifying physical evidence.

See [the PRD portfolio](PRD.md) and its 15 ticket-scoped PRDs for requirements and acceptance criteria.