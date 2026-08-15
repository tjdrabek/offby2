import { test, expect } from "@playwright/test";

const PROJECTS_URL = "http://localhost:3000/#/projects";

test("persists projects in IndexedDB across a browser-context restart", async ({
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
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(
    page.getByRole("heading", { name: "Editing Spice Jars" }),
  ).toBeVisible();

  // Snapshot IndexedDB and close the context, simulating the browser (and
  // therefore the app) restarting without clearing storage.
  const storageState = await context.storageState({ indexedDB: true });
  await context.close();

  const restoredContext = await browser.newContext({ storageState });
  const restoredPage = await restoredContext.newPage();
  await restoredPage.goto(PROJECTS_URL);

  const list = restoredPage.getByRole("list", { name: "Projects" });
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list.getByRole("listitem")).toContainText("Spice Jars");

  await restoredContext.close();
});
