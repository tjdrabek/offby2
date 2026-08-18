# 02 — Edge cut-off becomes an engine line producer

**What to build:** A calibration user's counted ladder lines and sheet margins become, via the engine's calibration entry, per-edge warnings and a sheet-axis hold-in line (sides separately from tops — the dead band's shortfall past each margin, applied to every label). The demo's calibration flow (cut-off fields, warnings, the allowance feeding the boundary) runs on the engine's version, and the demo's own edge cut-off math is deleted in the same slice.

**Blocked by:** 01 — The content boundary answers in the engine's main entry (needs the hold-in line type).

**Status:** done

- [x] Counted-lines→mm, per-edge warnings, and the axis allowance exposed from the calibration entry, producing a hold-in line the boundary accepts
- [x] Demo's edge cut-off tests migrated to the calibration entry seam and green
- [x] Demo calibration UI and app wiring import the engine's version; behaviour unchanged in the running demo
- [x] Demo's own edge cut-off module and test file deleted
