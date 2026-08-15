# Project Structure

High-level directory layout. Dotfiles, tests, and config files are excluded.

```
diy-labels/
├── public/              # Static assets served as-is
├── src/                 # Application source
│   ├── assets/          # Bundled static assets (images, icons)
│   ├── shell/           # Application-shell navigation (destinations, AppShell)
│   ├── tests/           # Playwright browser tests
│   ├── App.tsx          # Root application component
│   ├── App.css
│   ├── index.css
│   ├── test-setup.ts    # Vitest/RTL setup (jest-dom matchers)
│   └── main.tsx         # Application entry point
├── docs/                # Ralph loop tooling docs
├── scripts/             # Ralph loop automation scripts
└── .agent/              # Task specs, PRDs, logs, screenshots
    ├── prd/              # PRD portfolio (PRD-14 .. PRD-28)
    ├── tasks/             # Per-task detailed specs (TASK-1 .. TASK-125)
    ├── logs/              # Session build log (gitignored)
    └── screenshots/       # UI verification screenshots
```
