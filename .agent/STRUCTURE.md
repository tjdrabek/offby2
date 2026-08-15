# Project Structure

High-level directory layout. Dotfiles, tests, and config files are excluded.

```
diy-labels/
├── public/              # Static assets served as-is
│   └── icons/           # Generated PWA icon set (see scripts/generate-pwa-icons.mjs)
├── src/                 # Application source
│   ├── assets/          # Bundled static assets (images, icons)
│   ├── projects/        # LabelProject lifecycle + draft recovery (repository, hooks, UI)
│   │   └── testing/     # Shared in-memory repository fake for tests
│   ├── pwa/             # Service worker registration, update activation, pending-work durability
│   │   └── testing/     # Shared service-worker fakes for tests
│   ├── sheet-layouts/   # Sheet-layout source input, measurement parsing/units, normalized mm geometry, form
│   ├── shell/           # Application-shell navigation (destinations, AppShell)
│   ├── tests/           # Playwright browser tests
│   │   └── support/     # Shared browser-test helpers
│   ├── ui/              # Shared accessible UI primitives (modal confirm, focus trap, live region)
│   ├── App.tsx          # Root application component
│   ├── App.css
│   ├── index.css
│   ├── test-setup.ts    # Vitest/RTL setup (jest-dom matchers)
│   └── main.tsx         # Application entry point
├── docs/                # Ralph loop tooling docs
├── scripts/             # Ralph loop automation + PWA icon generation
└── .agent/              # Task specs, PRDs, logs, screenshots
    ├── prd/              # PRD portfolio (PRD-14 .. PRD-28)
    ├── tasks/             # Per-task detailed specs (TASK-1 .. TASK-125)
    ├── logs/              # Session build log (gitignored)
    └── screenshots/       # UI verification screenshots
```
