# 18 — Compose rich responsive label content

**What to build:** Extend the label editor with QR codes, local images, basic shapes, responsive flow layouts, and explicit overlays so every supported component persists, previews, and prints through the shared scene.

**Blocked by:** 17 — Generate deterministic text-label PDF output.

**Status:** ready-for-agent

**Prototype evidence:** The browser PDF calibration prototype (commit `5f3f67b`) demonstrated that fake QR-like marks, extracted text, arbitrary HTML rasterization, and incomplete affine rendering are insufficient. This slice replaces those shortcuts with constrained serializable content and one shared scene.

- [ ] The versioned content schema supports text, QR code, local image, basic shape, row, column, stack, and overlay elements.
- [ ] Flow elements support physical lengths, percentages, flexible space, intrinsic sizing, gaps, alignment, and constrained typography.
- [ ] Free positioning is available only inside explicit overlay containers and remains bounded by the physical content region.
- [ ] Imported images are copied into IndexedDB, referenced by durable identifiers, rendered offline, and never require an external URL.
- [ ] A documented bundled font set behaves consistently in preview and PDF output.
- [ ] Arbitrary JavaScript, imported React modules, raw persisted CSS, and live DOM capture are refused.
- [ ] Every supported component works end to end through editing, persistence, undo/redo, scene generation, SVG preview, PDF output, and diagnostics.
- [ ] Tests cover nested layouts, mixed sizing modes, asset loss, offline assets, QR geometry, overlays, and preview/PDF scene parity.