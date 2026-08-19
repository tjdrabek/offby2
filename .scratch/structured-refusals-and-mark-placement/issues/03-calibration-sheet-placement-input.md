# 03 — `calibrationSheet()` takes a named mark placement

**What to build:** Mark placement becomes an input to the package's calibration-sheet entry. Omitting it means the corner-label-centre placement — current behaviour, byte for byte. The demo's sheet-corner placement moves into the package: four marks at the largest round inset from a preferred list that keeps marks a minimum distance apart on the sheet's shorter axis, with a floor fallback for tiny sheets and the mark arm length bounded by the inset. Placements are package-vetted names, not caller-supplied coordinates. The plan records which placement produced it, so scenes and directions can branch on the plan alone. Calibration targets keep identity, operator-facing label, and intended position, but grid row and column stop being required — no consumer is forced to invent them for marks that belong to the sheet rather than to a label. Profile derivation keeps reading only target identities and intended positions and gains no placement awareness. The trade-off between placements (ink on backing paper versus one round figure, layout-independent targets, marks that survive dense layouts) is documented where the placements live.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Calling the calibration-sheet entry without a placement reproduces today's plans exactly — the regression pin for every current caller.
- [x] The sheet-corner placement yields four marks each at one shared, round inset from the two sheet edges it is measured from; the existing round-inset, minimum-separation, tiny-sheet-fallback, and arm-length cases move in from the demo as package tests.
- [x] The plan states its placement; targets no longer require grid coordinates, and the corner-label placement may still state them where they mean something.
- [x] Profile derivation is untouched and passes unchanged against plans from both placements.
- [x] Tests exercise external behaviour only, through the package's public entry points, following the existing calibration suite's pure-data example style.

## Comments

`calibrationSheet(geometry, placement?)` — `placement` is a new `MarkPlacement` (`"corner-label-centre" | "sheet-corner"`), defaulting to `"corner-label-centre"`. The old function became `cornerLabelCentrePlan`; `sheetCornerPlan` is a straight port of the demo's `cornerMarks.ts` algorithm (same preferred-inset list, minimum separation, floor fallback, and arm-length bound), now with its trade-off documented in `calibrationSheet.ts`'s module docstring rather than only in the demo module being deleted next. `CalibrationTarget.row`/`.column` are now optional; `sheet-corner` targets omit them entirely. `CalibrationSheetPlan` gained `placement`. `derivePrinterProfile.ts` was not touched — verified with a new parametrized test deriving the same translation from both placements' plans, since derivation reads only `target.id`/`.label`/`.intendedXMm`/`.intendedYMm`. Regression pin: `calibrationSheet(geometry())` deep-equals `calibrationSheet(geometry(), "corner-label-centre")`. Package: 363/363 tests, typecheck and lint clean.

Side effect recorded rather than fixed here: adding the required `placement` field to `CalibrationSheetPlan` breaks the demo's `cornerMarks.ts`, which builds that type by hand — exactly the module ticket 04 deletes. The demo's typecheck is red between this ticket and 04 landing.
