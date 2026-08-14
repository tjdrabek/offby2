# 21 — Record printing setups and operator confirmations

**What to build:** Let an operator record as much as they know about a printing setup, loading procedure, and print configuration and explicitly reconfirm unobservable assumptions before preparing printable output.

**Blocked by:** 14 — Create the recoverable local-first application shell.

**Status:** ready-for-agent

**Prototype evidence:** This slice relies on the browser PDF calibration prototype (commit `5f3f67b`) for feasibility of explicit setup identification, print-configuration confirmation, asymmetric plain-paper loading guidance, and operator-owned physical actions. The browser still cannot discover a physical printer or inspect dialog values.

- [ ] Users can create and name printing setups with known or explicitly unknown printer, operating-system, driver, browser, connection, media, and feed details.
- [ ] Loading procedures record feed source, leading edge, and printable-face direction as revisioned assumptions.
- [ ] Print configurations record paper size, scale, orientation, media type, feed source, duplex state, and page-decoration choices.
- [ ] Additional non-contradictory metadata can refine a setup without treating prior unknowns as compatibility wildcards.
- [ ] Contradictory known changes create a different setup or require recalibration rather than silently mutating profile assumptions.
- [ ] Setup attestation and final reconfirmation are explicit user actions with accessible explanations of what the application cannot inspect.
- [ ] The application does not expose printer discovery, silent printing, dialog introspection, or a claim that physical printing occurred.
- [ ] Persistence and browser tests cover incomplete metadata, revisions, contradiction handling, attestation, reconfirmation, and reload recovery.