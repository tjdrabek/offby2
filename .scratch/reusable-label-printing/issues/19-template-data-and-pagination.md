# 19 — Fill sheets from reusable templates and per-label data

**What to build:** Let a user reuse one label content template across positions with different data and overrides, mix unrelated content on the same sheet, skip positions, and paginate assignments deterministically across multiple pages.

**Blocked by:** 18 — Compose rich responsive label content.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for feasibility of used-position skipping and deterministic pagination. It replaces the prototype's narrow fake renderer with the production shared scene.

- [ ] A label content template defines named data inputs with optional defaults and validation.
- [ ] Each assigned position can supply template data and optional overrides without copying the entire template.
- [ ] A position can instead receive unrelated independent label content.
- [ ] Users can choose any available positions and skip unavailable positions in a stable documented order.
- [ ] Assignments exceeding one label sheet paginate deterministically, and preview and PDF page order agree.
- [ ] Editing a shared template updates its instances while preserving intentional per-label data and overrides.
- [ ] Persistence, named project snapshots, print preparations, and undo/redo preserve template relationships rather than flattening them silently.
- [ ] Tests cover mixed templates, independent content, sparse positions, overflow to multiple pages, stable ordering, and reload recovery.