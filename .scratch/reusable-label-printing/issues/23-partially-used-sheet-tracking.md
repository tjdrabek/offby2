# 23 — Track partially used sheets without claiming safe refeeding

**What to build:** Let a user remember the used positions on one identifiable physical label sheet and omit them from later output while making the operator reconfirm that attempting to refeed the sheet is their physical decision.

**Blocked by:** 19 — Fill sheets from reusable templates and per-label data; 21 — Record printing setups and operator confirmations; 22 — Check profile compatibility and prepare uncalibrated output.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for used-position skipping and its warning that skipping positions does not establish safe refeeding.

- [ ] Users can create a named sheet instance bound to one exact sheet-layout revision and record used positions and notes.
- [ ] A project can select a sheet instance, and preview, pagination, and PDF output deterministically omit its used positions.
- [ ] A sheet instance with an incompatible sheet-layout revision cannot be selected silently.
- [ ] Every reuse requires renewed inspection plus confirmation of loading procedure and leading edge.
- [ ] The UI persistently states that the application does not determine whether a partially used sheet is mechanically safe to refeed.
- [ ] A print preparation records the selected sheet instance, used positions, and renewed confirmation.
- [ ] Saving or reusing a sheet instance never creates a suitable-printing-setup or safe-refeeding claim.
- [ ] Tests cover reload recovery, layout incompatibility, sparse positions, renewed confirmation, output omission, and warning accessibility.