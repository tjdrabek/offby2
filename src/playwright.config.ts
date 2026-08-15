import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

/** Production preview origin; PWA behaviour only exists in built output. */
const PREVIEW_URL = "http://localhost:4173";

/** Specs that must run against the production build rather than the dev server. */
const PWA_SPECS = /pwa\..*\.spec\.ts/;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  globalTimeout: 30 * 60 * 1000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 3 : 6,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 1366, height: 768 },
  },

  webServer: [
    {
      command: "npm run build && npx vite preview --port 4173 --strictPort",
      cwd: projectRoot,
      url: `${PREVIEW_URL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
    },
  ],

  // NB: only chromium will run in Docker (arm64).
  projects: [
    {
      name: "chromium",
      testIgnore: PWA_SPECS,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-pwa",
      testMatch: PWA_SPECS,
      use: { ...devices["Desktop Chrome"], baseURL: PREVIEW_URL },
    },
  ],
});
