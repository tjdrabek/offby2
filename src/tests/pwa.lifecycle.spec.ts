import { test, expect } from "@playwright/test";
import { SCREENSHOTS, loadOnceOnlineAndTakeControl } from "./support/pwa.js";
import {
  createProject,
  projectStatus,
  readDurableProjects,
  saveRename,
} from "./support/lifecycle.js";

/**
 * The installed-application half of the lifecycle, which only exists in built
 * output: installation readiness, then the same project workflow run and
 * restarted with no network at all (see playwright.config.ts).
 */

test("stays installable and fully usable across an offline restart", async ({
  page,
  context,
  request,
  baseURL,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  // Installation readiness: declared metadata plus a worker in control.
  await loadOnceOnlineAndTakeControl(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ start_url: "/", display: "standalone" });
  expect(
    await page.evaluate(async () => {
      const ready = await navigator.serviceWorker.ready;
      return {
        scope: ready.scope,
        controlled: navigator.serviceWorker.controller !== null,
      };
    }),
  ).toEqual({ scope: `${baseURL}/`, controlled: true });

  await createProject(page, "Pantry Jars");
  const [created] = await readDurableProjects(page);

  await context.setOffline(true);

  const failedRequests: string[] = [];
  page.on("requestfailed", (failed) => failedRequests.push(failed.url()));

  await page.reload();

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Projects", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Pantry Jars");

  // Startup came entirely from the precache. The browser's own byte-check of
  // sw.js is expected to fail offline and does not participate in rendering.
  expect(failedRequests.filter((url) => !url.endsWith("/sw.js"))).toEqual([]);

  // The workflow itself must keep working with no network, not merely render.
  await page.getByRole("button", { name: "Open Pantry Jars" }).click();
  await saveRename(page, "Spice Jars");
  await expect(projectStatus(page)).toHaveText(
    'Project renamed to "Spice Jars".',
  );
  await page.screenshot({ path: `${SCREENSHOTS}TASK-9-3.png` });

  // Reopening while still offline is a fresh document, not a reload of the
  // page that primed the cache: the offline edit has to be durable.
  const reopened = await context.newPage();
  await reopened.goto("/#/projects");
  await expect(
    reopened.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Spice Jars");
  expect(await readDurableProjects(reopened)).toEqual([
    { id: created.id, name: "Spice Jars" },
  ]);

  expect(consoleErrors).toEqual([]);
});
