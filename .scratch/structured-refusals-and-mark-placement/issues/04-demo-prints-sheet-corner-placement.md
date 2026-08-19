# 04 — Demo prints the package's sheet-corner placement

**What to build:** The demo's calibration tab requests the sheet-corner placement from the package instead of replacing the package's planner. The demo's wholesale replacement module — the one that hand-constructs the package's plan type with admittedly meaningless grid coordinates — is deleted. The scene, printed directions, and preview read the placement from the plan; the one shared round distance the operator reads four times still appears once in the printed directions. The demo's measured-from-nearest-edge presentation stays in the demo: how to ask an operator for a measurement is host presentation, while the package continues to store positions from the sheet's left and top edges. The operator's printed sheet is unchanged.

**Blocked by:** 03 — `calibrationSheet()` takes a named mark placement.

**Status:** done

- [x] The calibration tab's plan comes from the package's calibration-sheet entry with the sheet-corner placement named; the demo constructs no plan of its own.
- [x] The replacement module and its fabricated grid coordinates are gone.
- [x] The printed sheet — marks, directions, and the single shared inset figure — is unchanged for the operator.
- [x] The demo's scene and focus suites adapt to consume the package's placement and pass; the demo ends with two fewer modules than the spec found it with (counting the message-surgery module from ticket 02).

## Comments

`App.tsx`'s calibration tab now calls the package's `calibrationSheet(geometry, "sheet-corner")` (imported aliased as `buildCalibrationSheet` to avoid shadowing the tab's own `calibrationSheet` memo). `lib/calibration/cornerMarks.ts` — the wholesale-replacement module that hand-built a `CalibrationSheetPlan` with meaningless grid coordinates — is deleted; `verify-calibration.mts` (a dev harness) and the scene/focus test suites now build their sheet-corner plans the same way, aliased as `sheetCornerPlan` in tests for clarity. `calibrationScene.ts` and every renderer downstream already took a generic `CalibrationSheetPlan`, so nothing there changed.

One real fix, not just a rename: `targetReferences.ts` named each corner using distinct grid `row`/`column` values, which `sheet-corner` marks no longer carry (ticket 03 made them optional, sheet-corner sets them to neither). Corner naming now keys off distinct `intendedXMm`/`intendedYMm` values instead — the same answer as row/column ever gave for `corner-label-centre` marks, so this is a generalization, not a behaviour change, and is exercised by the same suites.

Demo ends two modules lighter than the spec found it (`lib/messages.ts` from ticket 02, `lib/calibration/cornerMarks.ts` here). Full demo verification: typecheck, lint, 125/125 tests (including every calibration scene/focus suite, now against the package's own placement), and a clean production build.
