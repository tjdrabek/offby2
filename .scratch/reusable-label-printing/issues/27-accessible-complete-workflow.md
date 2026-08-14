# 27 — Complete keyboard and accessibility validation

**What to build:** Make the implemented authoring, validation, preparation, calibration-draft, and recovery journeys fully understandable and operable with a keyboard and assistive technology.

**Blocked by:** 20 — Enforce rounded safe areas and content insets; 23 — Track partially used sheets without claiming safe refeeding; 25 — Run an evidence-gated calibration draft.

**Status:** ready-for-agent

- [ ] Every primary workflow can be completed without pointer-only interaction, including content ordering and overlay positioning through accessible alternatives.
- [ ] Focus order is logical, visible, and restored appropriately after dialogs, navigation, refusals, imports, and PDF generation.
- [ ] Validation errors, compatibility results, calibration status, autosave status, and generation completion are announced and associated with their controls.
- [ ] Safe-area, provenance, uncalibrated, physical-evidence, and partially-used-sheet warnings never rely on color alone.
- [ ] Measurement controls expose units, constraints, derivations, and errors programmatically.
- [ ] Automated accessibility checks report no serious violations across primary screens.
- [ ] Keyboard-driven browser tests cover project creation, sheet-layout editing, content authoring, position assignment, safe-area refusal/override, setup attestation, calibration draft, backup, and PDF preparation.
- [ ] Manual screen-reader and zoom/reflow checks are documented for the release browser set without implying physical-print validation.