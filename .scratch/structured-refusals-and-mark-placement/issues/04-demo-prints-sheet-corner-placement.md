# 04 — Demo prints the package's sheet-corner placement

**What to build:** The demo's calibration tab requests the sheet-corner placement from the package instead of replacing the package's planner. The demo's wholesale replacement module — the one that hand-constructs the package's plan type with admittedly meaningless grid coordinates — is deleted. The scene, printed directions, and preview read the placement from the plan; the one shared round distance the operator reads four times still appears once in the printed directions. The demo's measured-from-nearest-edge presentation stays in the demo: how to ask an operator for a measurement is host presentation, while the package continues to store positions from the sheet's left and top edges. The operator's printed sheet is unchanged.

**Blocked by:** 03 — `calibrationSheet()` takes a named mark placement.

**Status:** ready-for-agent

- [ ] The calibration tab's plan comes from the package's calibration-sheet entry with the sheet-corner placement named; the demo constructs no plan of its own.
- [ ] The replacement module and its fabricated grid coordinates are gone.
- [ ] The printed sheet — marks, directions, and the single shared inset figure — is unchanged for the operator.
- [ ] The demo's scene and focus suites adapt to consume the package's placement and pass; the demo ends with two fewer modules than the spec found it with (counting the message-surgery module from ticket 02).

## Comments
