import { test, expect } from "@playwright/test";
import {
  createProject,
  openSession,
  projectStatus,
  readDurableDraftNames,
  readDurableProjects,
  restartSession,
  typeUnsavedRename,
} from "./support/lifecycle.js";
import { SCREENSHOTS } from "./support/paths.js";

/**
 * Discarding recovery. The recover path is covered as part of the full
 * journey in project-lifecycle.spec.ts; what is distinct here is that
 * declining recovery must remove only the draft.
 */

test("discards an unsaved rename after a restart, keeping the saved project", async ({
  browser,
  baseURL,
}) => {
  const consoleErrors: string[] = [];
  let session = await openSession(browser, baseURL!, { consoleErrors });

  await createProject(session.page, "Pantry Jars");
  const [created] = await readDurableProjects(session.page);
  await typeUnsavedRename(session.page, "Spice Jars");

  session = await restartSession(session, browser, baseURL!, { consoleErrors });

  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toBeVisible();
  await session.page.getByRole("button", { name: "Discard" }).click();

  const dialog = session.page.getByRole("alertdialog", {
    name: "Discard unsaved changes?",
  });
  await expect(dialog).toBeVisible();
  await session.page.screenshot({ path: `${SCREENSHOTS}TASK-9-4.png` });
  await dialog.getByRole("button", { name: "Discard" }).click();

  await expect(projectStatus(session.page)).toHaveText(
    "Unsaved changes discarded. Your saved project is unchanged.",
  );
  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);
  await expect(
    session.page.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Pantry Jars");

  // Only the draft is gone; the saved record is untouched.
  expect(await readDurableProjects(session.page)).toEqual([created]);
  expect(await readDurableDraftNames(session.page)).toEqual([]);

  session = await restartSession(session, browser, baseURL!, { consoleErrors });
  await expect(
    session.page.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Pantry Jars");
  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
  await session.context.close();
});
