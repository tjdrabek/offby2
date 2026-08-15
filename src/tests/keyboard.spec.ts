import { test, expect } from "@playwright/test";
import { SCREENSHOTS } from "./support/paths.js";
import { focusedOutline, tabUntilFocused } from "./support/keyboard.js";

const PROJECTS_URL = "http://localhost:3000/#/projects";

test("skips to main content and drives primary navigation from the keyboard", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  // The indicator must be painted, not merely declared.
  const outline = await focusedOutline(page);
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  // Destinations route on the hash, so skipping must not navigate.
  expect(new URL(page.url()).hash).toBe("");

  const nav = page.getByRole("navigation", { name: "Primary" });
  const projectsLink = nav.getByRole("link", { name: "Projects" });
  const layoutsLink = nav.getByRole("link", { name: "Sheet layouts" });

  await tabUntilFocused(page, projectsLink);
  await expect(projectsLink).toHaveAttribute("aria-current", "page");
  await page.screenshot({ path: `${SCREENSHOTS}TASK-8-1.png` });

  await page.keyboard.press("Tab");
  await expect(layoutsLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sheet layouts" }),
  ).toBeVisible();
  await expect(layoutsLink).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Shift+Tab");
  await expect(projectsLink).toBeFocused();
});

test("creates, opens, renames and deletes a project using the keyboard alone", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(PROJECTS_URL);

  const status = page.getByRole("status", { name: "Project status" });
  await expect(status).toBeEmpty();

  const createInput = page.getByLabel("Project name");
  await tabUntilFocused(page, createInput);
  await page.keyboard.type("Pantry Jars");
  await page.keyboard.press("Enter");
  await expect(status).toHaveText(
    'Project "Pantry Jars" created and opened for editing.',
  );

  await page.keyboard.type("Spice Jars");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Editing Spice Jars" }),
  ).toBeVisible();

  // Space activates a native button, so opening needs no custom key handling.
  const openPantry = page.getByRole("button", { name: "Open Pantry Jars" });
  await tabUntilFocused(page, openPantry);
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("heading", { name: "Editing Pantry Jars" }),
  ).toBeVisible();

  const renameInput = page.getByLabel("Rename project");
  await tabUntilFocused(page, renameInput);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Pantry Jars 2026");
  await page.keyboard.press("Enter");
  await expect(status).toHaveText('Project renamed to "Pantry Jars 2026".');

  const deleteButton = page.getByRole("button", {
    name: "Delete Pantry Jars 2026",
  });
  await tabUntilFocused(page, deleteButton, { shift: true });
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("alertdialog", { name: "Delete project?" });
  await expect(dialog).toBeVisible();
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const confirm = dialog.getByRole("button", { name: "Delete" });
  await expect(cancel).toBeFocused();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-8-2.png` });

  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  // Tab past the last control stays inside the dialog.
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(deleteButton).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");

  await expect(dialog).toHaveCount(0);
  await expect(status).toHaveText('Project "Pantry Jars 2026" deleted.');
  // The row the dialog was opened from is gone, so focus lands on the page's
  // first action instead of falling back to the document body.
  await expect(createInput).toBeFocused();

  expect(consoleErrors).toEqual([]);
});

test("resolves recovery from the keyboard and announces the outcome", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(PROJECTS_URL);

  await page.getByLabel("Project name").fill("Pantry Jars");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(
    page.getByRole("heading", { name: "Editing Pantry Jars" }),
  ).toBeVisible();
  await page.getByLabel("Rename project").fill("Spice Jars");
  await page.waitForTimeout(600);

  const storageState = await context.storageState({ indexedDB: true });
  await context.close();

  const restoredContext = await browser.newContext({ storageState });
  const restored = await restoredContext.newPage();
  await restored.goto(PROJECTS_URL);

  const heading = restored.getByRole("heading", {
    name: "Recover unsaved changes?",
  });
  await expect(heading).toBeVisible();
  // The offer takes focus on arrival, so the choice is the next thing reached.
  await expect(heading).toBeFocused();
  await restored.screenshot({ path: `${SCREENSHOTS}TASK-8-3.png` });

  const recover = restored.getByRole("button", {
    name: 'Recover "Spice Jars"',
  });
  await tabUntilFocused(restored, recover);
  await restored.keyboard.press("Enter");

  await expect(
    restored.getByRole("status", { name: "Project status" }),
  ).toHaveText('Unsaved changes recovered. Project renamed to "Spice Jars".');
  await expect(restored.getByLabel("Project name")).toBeFocused();

  await restoredContext.close();
});
