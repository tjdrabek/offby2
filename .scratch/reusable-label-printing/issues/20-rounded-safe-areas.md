# 20 — Enforce rounded safe areas and content insets

**What to build:** Show and enforce the usable rounded region of each label so users can keep content away from die-cut corners and physical alignment risk, while retaining an explicit auditable override for intentional exceptions.

**Blocked by:** 18 — Compose rich responsive label content.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for feasibility of content validation before final output. It replaces the prototype's axis-aligned-only validation with rounded label boundaries and additive content insets.

- [ ] The safe area is the rounded label boundary reduced by the requested alignment tolerance.
- [ ] A uniform or independent top/right/bottom/left content inset reduces the safe area again and remains distinct from sheet-layout margins.
- [ ] Label and sheet previews continuously show the label boundary, safe area, content region, and element-specific violations.
- [ ] Unknown corner radius permits editing and output but produces a visible diagnostic and no corner-safety conclusion.
- [ ] Safe-area violations block PDF preparation by default with actionable explanations.
- [ ] An advanced explicit override permits generation and records every violation and override in the print preparation without establishing physical safety.
- [ ] Geometry and browser tests cover rounded corners, square corners, unknown radius, extreme insets, nested content, overlays, refusal, and override audit data.
- [ ] Preview masks or clipping are never described as proof that physical content will remain inside the die cut.