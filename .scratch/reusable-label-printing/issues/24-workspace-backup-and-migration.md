# 24 — Back up, restore, migrate, and delete the complete workspace

**What to build:** Give users a complete, versioned, inspectable backup and recovery path for all implemented records and assets without requiring an account, server, or silent partial import.

**Blocked by:** 15 — Create and revise a sheet layout; 18 — Compose rich responsive label content; 19 — Fill sheets from reusable templates and per-label data; 21 — Record printing setups and operator confirmations; 22 — Check profile compatibility and prepare uncalibrated output; 23 — Track partially used sheets without claiming safe refeeding.

**Status:** ready-for-agent

**Prototype evidence:** The browser PDF calibration prototype (commit `5f3f67b`) demonstrated only that draft and profile-shaped data can serialize. Its browser local-storage mechanism is not the production persistence or backup boundary.

- [ ] A versioned export contains every implemented durable record, named snapshot, referenced asset, schema version, and integrity metadata.
- [ ] A clean browser can import an export and reproduce projects, previews, sheet instances, printing setups, profiles, and print preparations.
- [ ] Import validates before commit and reports migrations, duplicate identities, missing/corrupt assets, unsupported future versions, and incompatible records.
- [ ] A failed import rolls back transactionally and never silently drops a subset of records.
- [ ] Users can delete individual records with dependency-aware explanations and can explicitly delete all local application data.
- [ ] Export and import work offline and remain keyboard accessible.
- [ ] Versioned fixtures test current round trips, older-schema migrations, corruption, unsupported versions, rollback, and referential integrity.
- [ ] Future tickets adding durable records must register them with export, import, deletion, and migration behavior.