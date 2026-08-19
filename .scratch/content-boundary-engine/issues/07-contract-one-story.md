# 07 — Contract: one story left standing

**What to build:** The engine tells exactly one story about where content stops. The demo's own boundary module and its test file are deleted; the package's old symmetric safe-area function is reimplemented as a special case of the content boundary or removed with a deprecation note; engine documentation carries the canonical phrasing — "each hold-in is a line, and content stops at whichever sits furthest in, per axis."

**Blocked by:** 04 — The demo preview draws from the engine; 05 — Fit measurement agrees with the engine; 06 — The printable output holds the same lines.

**Status:** done

- [x] Demo boundary module and test file deleted; no demo code computes a boundary
- [x] Old symmetric safe-area function reimplemented on the boundary or deprecated, so the package exposes one model
- [x] Engine docs use the CONTEXT.md vocabulary (hold-in line, content boundary, edge cut-off allowance)
- [x] Full package and demo typecheck, lint, tests, and builds green
