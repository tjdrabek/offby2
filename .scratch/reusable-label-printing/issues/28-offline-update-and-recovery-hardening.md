# 28 — Harden offline updates and the production recovery journey

**What to build:** Verify that the complete non-physical product journey remains reliable offline, survives application updates and failures, and can be recovered from a user-owned backup without losing drafts or making unsupported physical claims.

**Blocked by:** 24 — Back up, restore, migrate, and delete the complete workspace; 25 — Run an evidence-gated calibration draft; 27 — Complete keyboard and accessibility validation.

**Status:** ready-for-agent

**Prototype evidence:** The browser PDF calibration prototype (commit `5f3f67b`) demonstrated serializable restoration as feasibility only. This slice must use production IndexedDB, migration, backup, and controlled service-worker update behavior rather than prototype local storage.

- [ ] After initial installation, users can start offline, open projects, edit content, preview sheets, prepare uncalibrated PDFs, and export backups using bundled assets and fonts.
- [ ] Service-worker updates are announced and activate only through a controlled reload after open drafts are durable.
- [ ] Interrupted writes, storage errors, missing assets, failed PDF generation, and failed imports surface recoverable explanations without corrupting existing records.
- [ ] A fresh browser can restore a complete backup and reproduce normalized scenes, PDF hashes, project snapshots, sheet instances, setups, and calibration drafts.
- [ ] One browser-level acceptance journey covers creation, restart, offline use, safe-area refusal, setup attestation, PDF preparation, export, deletion, import, and recovery.
- [ ] Physical suitability, alignment tolerance, and validated calibration remain explicitly unavailable until ticket 26 and its physical blockers are complete.
- [ ] Release documentation distinguishes tested software behavior, untested browser/platform combinations, and physically blocked claims.
- [ ] `git diff --check`, type checking, linting, unit tests, browser tests, accessibility checks, offline tests, and production build all pass.