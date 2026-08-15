import { test, expect } from "@playwright/test";

test("project lifecycle: create, open, rename, cancel-delete, confirm-delete", async ({
  page,
}) => {
  await page.goto("/#/projects");

  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(
    page.getByText("No projects yet. Create one to get started."),
  ).toBeVisible();

  await page.getByLabel("Project name").fill("Pantry Jars");
  await page.getByRole("button", { name: "Create project" }).click();

  const list = page.getByRole("list", { name: "Projects" });
  await expect(list.getByRole("listitem")).toContainText("Pantry Jars");
  await expect(
    page.getByRole("heading", { name: "Editing Pantry Jars" }),
  ).toBeVisible();

  const renameInput = page.getByLabel("Rename project");
  await renameInput.fill("Spice Jars");
  await page.getByRole("button", { name: "Save name" }).click();

  await expect(
    page.getByRole("heading", { name: "Editing Spice Jars" }),
  ).toBeVisible();
  await expect(list.getByRole("listitem")).toContainText("Spice Jars");

  await page.getByRole("button", { name: "Delete Spice Jars" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete project?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(list.getByRole("listitem")).toContainText("Spice Jars");

  await page.getByRole("button", { name: "Delete Spice Jars" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();

  await expect(
    page.getByText("No projects yet. Create one to get started."),
  ).toBeVisible();
});
