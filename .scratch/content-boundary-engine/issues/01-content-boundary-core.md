# 01 — The content boundary answers in the engine's main entry

**What to build:** A host developer asks the engine where content stops: they hand it a set of named hold-in lines — each declaring whether it lives on the sheet's axes or the design frame's — and the design frame (orientation and extents), and get back the content boundary per frame axis plus each line's own held distance. The sheet-axis→frame-axis remap and the half-extent clamp happen inside the engine; no caller can apply them. Shape from the design session: `contentBoundary(lines, frame) → { xMm, yMm, lines: { [name]: { xMm, yMm } } }`.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Exported from the package's main entry beside the other sheet-layout math; pure data in and out, no DOM or framework types
- [x] Demo's content-inset example tests migrated to this seam and green
- [x] New example cases: sideways frame with unequal sheet-axis allowances; lines that cross (inset inside the cut-off line on one axis, outside on the other); frame narrow enough to trigger the clamp
- [x] Property test: boundary per axis equals the most obtrusive held line, and rotating the frame while swapping sheet-axis line coordinates leaves the answer unchanged
- [x] Package tests run in plain Node; typecheck and lint clean
