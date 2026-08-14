# 16 — Author and preview a text label project

**What to build:** The first complete label-content path: create a serializable text-based label content template, assign it to a position in a label project, autosave it, and see label and sheet previews rendered from one shared printable scene.

**Blocked by:** 15 — Create and revise a sheet layout.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) only for its demonstrated separation of label content from sheet geometry. It must not reuse the prototype's extracted-text renderer or dual layout sources.

- [ ] A project can select an exact sheet-layout revision and create a versioned label content template containing constrained text.
- [ ] A user can assign the template to a chosen label position and recover it after reload.
- [ ] A framework-neutral printable scene is authoritative for both label-level and sheet-level React/SVG previews.
- [ ] Text layout responds to the physical content region rather than viewport or preview size.
- [ ] Preview zoom scales the laid-out scene without changing wrapping, breakpoints, or component positions.
- [ ] Autosave and session undo/redo work through the visible editor without persisting transient preview state.
- [ ] Tests assert scene and preview behavior rather than React component internals.
- [ ] Implementation notes identify the prototype conclusion used and distinguish it from production or physical evidence.