# 15 — Create and revise a sheet layout

**What to build:** A complete sheet-layout editor where a user can enter uniform-grid geometry in their preferred measurement system, resolve valid dimensions, preview rounded label boundaries, and save immutable revisions with honest provenance and physical-verification status.

**Blocked by:** 14 — Create the recoverable local-first application shell.

**Status:** ready-for-agent

- [ ] Users can enter sheet and label dimensions, row and column counts, four outer margins, horizontal and vertical gaps, and a zero, known, estimated, or unknown corner radius.
- [ ] Fractional-imperial, decimal-imperial, and metric input normalize to millimetres while the UI preserves the user's display preference.
- [ ] Exactly one missing dimension is derived only when it has one valid solution, and the UI discloses the derivation.
- [ ] Contradictory, negative, non-finite, overlapping, out-of-sheet, or unsupported geometry is refused without silent adjustment.
- [ ] Editing geometry creates a new immutable sheet-layout revision and deterministic geometry fingerprint; independently editing catalog data creates a new identity.
- [ ] Product identity, source provenance, and physical-verification status are displayed independently, and catalog inclusion never implies physical verification.
- [ ] A persisted visual preview shows rows, columns, gaps, margins, and square or rounded label boundaries.
- [ ] Contract and browser tests cover unit parsing, derivation, refusals, revision history, persistence, and deterministic fingerprints.