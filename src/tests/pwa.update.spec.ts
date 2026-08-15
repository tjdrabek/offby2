import { test, expect, type Page } from "@playwright/test";
import {
  SCREENSHOTS,
  controllerScriptUrl,
  installWaitingUpdate,
  loadOnceOnlineAndTakeControl,
} from "./support/pwa.js";

/**
 * Controlled activation of a waiting service worker, verified against the
 * production preview build (see playwright.config.ts).
 */

const CREATED_NAME = "Spice Jars";
const TYPED_NAME = "Spice Jars 2026";

/** Creates a project and types a rename that is deliberately never saved. */
async function openProjectWithUnsavedRename(page: Page) {
  await page.getByLabel("Project name").fill(CREATED_NAME);
  await page.getByRole("button", { name: "Create project" }).click();
  const rename = page.getByLabel("Rename project");
  await expect(rename).toHaveValue(CREATED_NAME);
  await rename.fill(TYPED_NAME);
  return rename;
}

/** Counts main-frame navigations, so "reloads exactly once" is measurable. */
function countNavigations(page: Page) {
  const counter = { value: 0 };
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) counter.value += 1;
  });
  return counter;
}

test("applies a waiting update only after the open draft is durable", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await loadOnceOnlineAndTakeControl(page);
  const rename = await openProjectWithUnsavedRename(page);

  await installWaitingUpdate(page);

  const notice = page.getByRole("status");
  await expect(notice).toContainText("Update available:");
  await expect(page.getByRole("button", { name: "Update now" })).toBeVisible();
  // The waiting worker must not take the page out from under the typed name.
  await expect(rename).toHaveValue(TYPED_NAME);
  expect(await controllerScriptUrl(page)).not.toContain("update=2");
  await page.screenshot({ path: `${SCREENSHOTS}TASK-7-1.png` });

  const navigations = countNavigations(page);
  await page.getByRole("button", { name: "Update now" }).click();

  await expect.poll(() => controllerScriptUrl(page)).toContain("update=2");
  // The draft was written before activation, so the reloaded page can offer it.
  await expect(
    page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Recover "${TYPED_NAME}"` }),
  ).toBeVisible();
  expect(navigations.value).toBe(1);
  expect(consoleErrors).toEqual([]);

  await page.screenshot({ path: `${SCREENSHOTS}TASK-7-2.png` });
});

test("refuses to activate while the open draft cannot be saved", async ({
  page,
}) => {
  // Fault injection at the browser boundary: only draft writes fail, so the
  // project itself is created normally and the update has real work to block on.
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function put(
      this: IDBObjectStore,
      value: unknown,
      key?: IDBValidKey,
    ): IDBRequest<IDBValidKey> {
      if (this.name === "projectDrafts") {
        throw new DOMException(
          "Injected draft write failure",
          "InvalidStateError",
        );
      }
      return originalPut.call(this, value, key);
    };
  });

  await loadOnceOnlineAndTakeControl(page);
  const rename = await openProjectWithUnsavedRename(page);

  await installWaitingUpdate(page);
  const notice = page.getByRole("status");
  await expect(notice).toContainText("Update available:");

  const navigations = countNavigations(page);
  await page.getByRole("button", { name: "Update now" }).click();

  await expect(notice).toContainText("Update blocked:");
  await expect(notice).toContainText("Injected draft write failure");
  await expect(
    page.getByRole("button", { name: "Try updating again" }),
  ).toBeVisible();

  // The page kept running, with the typed name and the old worker intact.
  await expect(rename).toHaveValue(TYPED_NAME);
  expect(await controllerScriptUrl(page)).not.toContain("update=2");
  expect(navigations.value).toBe(0);

  await page.screenshot({ path: `${SCREENSHOTS}TASK-7-3.png` });
});
