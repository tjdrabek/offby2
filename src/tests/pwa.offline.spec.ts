import { test, expect } from "@playwright/test";
import { SCREENSHOTS, loadOnceOnlineAndTakeControl } from "./support/pwa.js";

/**
 * Offline startup after one successful load, verified against the production
 * preview build (see playwright.config.ts).
 */

test("renders the shell and persisted projects after an offline restart", async ({
  page,
  context,
}) => {
  await loadOnceOnlineAndTakeControl(page);

  await page.getByLabel("Project name").fill("Pantry Jars");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(
    page.getByRole("heading", { name: "Editing Pantry Jars" }),
  ).toBeVisible();

  await context.setOffline(true);

  const failedRequests: string[] = [];
  page.on("requestfailed", (request) => failedRequests.push(request.url()));

  await page.reload();

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  const list = page.getByRole("list", { name: "Projects" });
  await expect(list.getByRole("listitem")).toContainText("Pantry Jars");
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller !== null),
  ).toBe(true);

  // Startup must be served entirely from the precache. The browser's own
  // byte-check of sw.js is expected to fail while offline and does not
  // participate in rendering.
  const startupFailures = failedRequests.filter(
    (url) => !url.endsWith("/sw.js"),
  );
  expect(startupFailures).toEqual([]);

  await page.screenshot({ path: `${SCREENSHOTS}TASK-6-1.png` });

  // Positive control: anything not precached is genuinely unreachable, so the
  // render above cannot have come from the network. (Chromium does not flip
  // navigator.onLine for an emulated offline context, so probe instead.)
  const reachedNetwork = await page.evaluate(async () => {
    try {
      await fetch("/__offline-probe", { cache: "no-store" });
      return true;
    } catch {
      return false;
    }
  });
  expect(reachedNetwork).toBe(false);
});

test("reopens in a new offline window without any network fallback", async ({
  page,
  context,
}) => {
  await loadOnceOnlineAndTakeControl(page);

  await page.getByLabel("Project name").fill("Seed Packets");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(
    page.getByRole("heading", { name: "Editing Seed Packets" }),
  ).toBeVisible();

  await context.setOffline(true);

  // Reopening the installed application is a fresh document in the same
  // origin storage, not a reload of the page that primed the cache.
  const reopened = await context.newPage();
  await reopened.goto("/#/projects");

  await expect(
    reopened.getByRole("navigation", { name: "Primary" }),
  ).toBeVisible();
  await expect(
    reopened.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Seed Packets");

  await reopened.screenshot({ path: `${SCREENSHOTS}TASK-6-2.png` });
});
