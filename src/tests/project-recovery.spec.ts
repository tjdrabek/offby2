import { test, expect } from "@playwright/test";

const PROJECTS_URL = "http://localhost:3000/#/projects";

test("recovers an unsaved rename after a browser-context restart", async ({
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

  // Edit the name but never click "Save name": the draft should be
  // persisted in the background (debounced) without a committed rename.
  await page.getByLabel("Rename project").fill("Spice Jars");
  await page.waitForTimeout(600);

  const storageState = await context.storageState({ indexedDB: true });
  await context.close();

  const restoredContext = await browser.newContext({ storageState });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(PROJECTS_URL);

  await expect(
    restoredPage.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toBeVisible();
  await restoredPage
    .getByRole("button", { name: 'Recover "Spice Jars"' })
    .click();

  const list = restoredPage.getByRole("list", { name: "Projects" });
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list.getByRole("listitem")).toContainText("Spice Jars");
  await expect(
    restoredPage.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);

  await restoredContext.close();
});

test("discards an unsaved rename after a browser-context restart, keeping the saved project", async ({
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
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(PROJECTS_URL);

  await expect(
    restoredPage.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toBeVisible();
  await restoredPage.getByRole("button", { name: "Discard" }).click();
  const dialog = restoredPage.getByRole("alertdialog", {
    name: "Discard unsaved changes?",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Discard" }).click();

  await expect(
    restoredPage.getByRole("heading", { name: "Recover unsaved changes?" }),
  ).toHaveCount(0);
  const list = restoredPage.getByRole("list", { name: "Projects" });
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list.getByRole("listitem")).toContainText("Pantry Jars");

  await restoredContext.close();
});
