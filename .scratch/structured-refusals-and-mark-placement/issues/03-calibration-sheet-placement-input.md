# 03 — `calibrationSheet()` takes a named mark placement

**What to build:** Mark placement becomes an input to the package's calibration-sheet entry. Omitting it means the corner-label-centre placement — current behaviour, byte for byte. The demo's sheet-corner placement moves into the package: four marks at the largest round inset from a preferred list that keeps marks a minimum distance apart on the sheet's shorter axis, with a floor fallback for tiny sheets and the mark arm length bounded by the inset. Placements are package-vetted names, not caller-supplied coordinates. The plan records which placement produced it, so scenes and directions can branch on the plan alone. Calibration targets keep identity, operator-facing label, and intended position, but grid row and column stop being required — no consumer is forced to invent them for marks that belong to the sheet rather than to a label. Profile derivation keeps reading only target identities and intended positions and gains no placement awareness. The trade-off between placements (ink on backing paper versus one round figure, layout-independent targets, marks that survive dense layouts) is documented where the placements live.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Calling the calibration-sheet entry without a placement reproduces today's plans exactly — the regression pin for every current caller.
- [ ] The sheet-corner placement yields four marks each at one shared, round inset from the two sheet edges it is measured from; the existing round-inset, minimum-separation, tiny-sheet-fallback, and arm-length cases move in from the demo as package tests.
- [ ] The plan states its placement; targets no longer require grid coordinates, and the corner-label placement may still state them where they mean something.
- [ ] Profile derivation is untouched and passes unchanged against plans from both placements.
- [ ] Tests exercise external behaviour only, through the package's public entry points, following the existing calibration suite's pure-data example style.

## Comments
