# 14 — Create the recoverable local-first application shell

**What to build:** An installable React, TypeScript, and Vite PWA where a user can create a named label project, navigate the application, reload the browser, and recover that project from local storage without an account or server.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] A user can create, rename, open, and delete a minimal label project from the Projects destination.
- [ ] Projects persist in versioned IndexedDB records and survive a browser restart.
- [ ] The shell exposes Projects, Sheet layouts, Printing setups and calibration, Assets, and Settings and backup destinations.
- [ ] Static application assets support installation and subsequent offline startup.
- [ ] A pending service-worker update cannot silently discard an open draft.
- [ ] The primary shell and project actions are keyboard operable with visible focus and semantic names.
- [ ] Browser-level tests verify project creation, restart recovery, deletion, and offline startup through user-visible behavior.