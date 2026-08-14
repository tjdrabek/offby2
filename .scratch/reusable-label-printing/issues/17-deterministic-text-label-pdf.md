# 17 — Generate deterministic text-label PDF output

**What to build:** Generate and download deterministic PDF printable output for a text-label project, with an explicit physical page size, embedded or outlined bundled fonts, structured diagnostics, and a saved print preparation.

**Blocked by:** 16 — Author and preview a text label project.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for feasibility of deterministic client-side PDF bytes, explicit PDF page boxes, and millimetre-to-point geometry. Its ad hoc PDF writer, raster shortcuts, and preview-size check are not production implementations or physical evidence.

- [ ] The PDF renderer accepts only a validated printable scene and explicit page geometry and returns bytes plus structured diagnostics.
- [ ] Generated PDF page boxes match the selected sheet dimensions after millimetre-to-point conversion at the renderer boundary.
- [ ] Bundled font glyphs are embedded or outlined so installed system fonts do not affect output.
- [ ] Identical normalized inputs produce byte-identical output and the same content hash.
- [ ] Successful generation saves a print preparation with project snapshot, output hash, timestamp, sheet-layout revision and fingerprint, selected positions, uncalibrated status, overrides, and diagnostics.
- [ ] Downloading or opening the PDF is not recorded as a confirmed physical print.
- [ ] Artifact tests parse the PDF to verify page boxes, page count, text placement, font treatment, determinism, and diagnostics.
- [ ] UI and documentation state that an exact PDF page box is software evidence only and does not prove physical scale or placement.