import { test, expect } from "@playwright/test";
import { SCREENSHOTS } from "./support/paths.js";
import {
  createProject,
  openSession,
  projectStatus,
  readDurableDraftNames,
  readDurableProjects,
  restartSession,
  saveRename,
  typeUnsavedRename,
} from "./support/lifecycle.js";

/**
 * Browser acceptance coverage for the whole visible project lifecycle. Every
 * assertion targets a role, an accessible name, a heading, an announcement, or
 * a durable record — never application internals.
 */

test("carries a project through create, open, rename, restart, and deletion", async ({
  browser,
  baseURL,
}) => {
  const consoleErrors: string[] = [];
  let session = await openSession(browser, baseURL!, { consoleErrors });

  await expect(
    session.page.getByText("No projects yet. Create one to get started."),
  ).toBeVisible();

  // An unusable submit must say so rather than silently doing nothing.
  await session.page.getByRole("button", { name: "Create project" }).click();
  await expect(session.page.getByRole("alert")).toHaveText(
    "Enter a project name before creating a project.",
  );

  await createProject(session.page, "Pantry Jars");
  await expect(projectStatus(session.page)).toHaveText(
    'Project "Pantry Jars" created and opened for editing.',
  );
  await createProject(session.page, "Seed Packets");

  const list = session.page.getByRole("list", { name: "Projects" });
  await expect(list.getByRole("listitem")).toHaveCount(2);

  // Opening is explicit: the row reports which project is currently open.
  await session.page.getByRole("button", { name: "Open Pantry Jars" }).click();
  await expect(
    session.page.getByRole("heading", { name: "Editing Pantry Jars" }),
  ).toBeVisible();
  await expect(
    session.page.getByRole("button", { name: "Currently open: Pantry Jars" }),
  ).toBeVisible();

  await saveRename(session.page, "Spice Jars");
  await expect(projectStatus(session.page)).toHaveText(
    'Project renamed to "Spice Jars".',
  );
  await expect(list.getByRole("listitem").first()).toContainText("Spice Jars");

  const before = await readDurableProjects(session.page);
  expect(before.map((project) => project.name).sort()).toEqual([
    "Seed Packets",
    "Spice Jars",
  ]);

  session = await restartSession(session, browser, baseURL!, { consoleErrors });

  // Identity, not just the label, has to survive the restart.
  expect(await readDurableProjects(session.page)).toEqual(before);
  const restoredList = session.page.getByRole("list", { name: "Projects" });
  await expect(restoredList.getByRole("listitem")).toHaveCount(2);
  await expect(restoredList).toContainText("Spice Jars");
  await expect(restoredList).toContainText("Seed Packets");
  // Nothing was left unsaved, so nothing may be offered for recovery.
  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);

  await session.page.screenshot({ path: `${SCREENSHOTS}TASK-9-1.png` });

  // Cancelling a deletion must leave the project exactly as it was.
  await session.page.getByRole("button", { name: "Delete Spice Jars" }).click();
  const dialog = session.page.getByRole("alertdialog", {
    name: "Delete project?",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(restoredList.getByRole("listitem")).toHaveCount(2);
  expect(await readDurableProjects(session.page)).toEqual(before);

  await session.page.getByRole("button", { name: "Delete Spice Jars" }).click();
  await session.page
    .getByRole("alertdialog", { name: "Delete project?" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(projectStatus(session.page)).toHaveText(
    'Project "Spice Jars" deleted.',
  );
  await expect(restoredList.getByRole("listitem")).toHaveCount(1);
  await expect(restoredList).toContainText("Seed Packets");

  session = await restartSession(session, browser, baseURL!, { consoleErrors });

  // The deletion is durable, and it removed only the requested project.
  expect(await readDurableProjects(session.page)).toEqual(
    before.filter((project) => project.name === "Seed Packets"),
  );
  await expect(
    session.page.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toHaveCount(1);

  expect(consoleErrors).toEqual([]);
  await session.context.close();
});

test("recovers an unsaved rename after a restart and keeps it durable", async ({
  browser,
  baseURL,
}) => {
  const consoleErrors: string[] = [];
  let session = await openSession(browser, baseURL!, { consoleErrors });

  await createProject(session.page, "Pantry Jars");
  const [created] = await readDurableProjects(session.page);

  // Typed but never saved: the committed record must still read "Pantry Jars".
  await typeUnsavedRename(session.page, "Spice Jars");
  expect(await readDurableProjects(session.page)).toEqual([created]);

  session = await restartSession(session, browser, baseURL!, { consoleErrors });

  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toBeVisible();
  await session.page.screenshot({ path: `${SCREENSHOTS}TASK-9-2.png` });

  await session.page
    .getByRole("button", { name: 'Recover "Spice Jars"' })
    .click();
  await expect(projectStatus(session.page)).toHaveText(
    'Unsaved changes recovered. Project renamed to "Spice Jars".',
  );
  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);
  await expect(
    session.page.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Spice Jars");

  // Recovery committed the rename onto the same record and consumed the marker.
  expect(await readDurableProjects(session.page)).toEqual([
    { id: created.id, name: "Spice Jars" },
  ]);
  expect(await readDurableDraftNames(session.page)).toEqual([]);

  session = await restartSession(session, browser, baseURL!, { consoleErrors });

  await expect(
    session.page.getByRole("list", { name: "Projects" }).getByRole("listitem"),
  ).toContainText("Spice Jars");
  // A consumed recovery must never be offered a second time.
  await expect(
    session.page.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
  await session.context.close();
});
