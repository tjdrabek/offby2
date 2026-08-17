import { test, expect, type Page } from "@playwright/test";
import { SCREENSHOTS } from "./support/paths.js";
import {
  fillConsistentSheet,
  openSheetLayouts,
} from "./support/sheetLayout.js";

/**
 * Reads the durable revisions straight from IndexedDB.
 *
 * The database is opened without a version so the reader can never upgrade or
 * reshape the schema under test, and a missing store resolves to an empty list.
 */
function readDurableRevisions(page: Page) {
  return page.evaluate(
    () =>
      new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const request = indexedDB.open("offby2");
        request.onerror = () =>
          reject(new Error("Could not open the database"));
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("sheetLayoutRevisions")) {
            db.close();
            resolve([]);
            return;
          }
          const all = db
            .transaction("sheetLayoutRevisions", "readonly")
            .objectStore("sheetLayoutRevisions")
            .getAll();
          all.onsuccess = () => {
            db.close();
            resolve(all.result as Record<string, unknown>[]);
          };
          all.onerror = () => {
            db.close();
            reject(new Error("Could not read the revisions"));
          };
        };
      }),
  );
}

test("saves immutable sheet-layout revisions under one stable identity", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);
  const check = page.getByRole("button", { name: "Check measurements" });
  const status = page.getByRole("status", { name: "Sheet layout save status" });

  // Nothing can be saved before the measurements have been accepted.
  await expect(
    page.getByRole("button", { name: "Save as a new sheet layout" }),
  ).toHaveCount(0);
  await expect(page.getByText("No sheet layouts saved yet.")).toBeVisible();

  await fillConsistentSheet(page);
  await check.click();
  await page.getByLabel("Sheet layout name").fill("Avery L7160");
  await page
    .getByRole("button", { name: "Save as a new sheet layout" })
    .click();

  await expect(status).toHaveText(
    'Sheet layout "Avery L7160" saved as revision 1.',
  );
  const revisions = page.getByRole("table", {
    name: "Revisions of Avery L7160",
  });
  await expect(revisions.getByRole("row")).toHaveCount(2);
  await revisions.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-14-1.png` });

  // A corrected label size is a new revision, never an edit of the old one.
  // 210 = 10 + 3 × 59 + 2 × 6.5 + 10.
  await fillConsistentSheet(page, [
    ["Label width", "59"],
    ["Horizontal gap", "6.5"],
  ]);
  await check.click();
  await page
    .getByRole("button", { name: "Save as revision 2 of Avery L7160" })
    .click();

  await expect(status).toHaveText(
    'Revision 2 of "Avery L7160" saved. Earlier revisions are unchanged.',
  );
  await expect(
    revisions.getByRole("row", { name: /Revision 1/ }),
  ).toContainText("60 × 38");
  await expect(
    revisions.getByRole("row", { name: /Revision 2/ }),
  ).toContainText("59 × 38");
  await expect(
    page.getByRole("list", { name: "Saved sheet layouts" }),
  ).toContainText("Avery L7160 — 2 revisions");
  await revisions.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-14-2.png` });

  // Both revisions are durable, and revision 1 still holds what it was saved with.
  const stored = await readDurableRevisions(page);
  expect(stored).toHaveLength(2);
  const layoutIds = new Set(stored.map((revision) => revision.layoutId));
  expect(layoutIds.size).toBe(1);
  const first = stored.find((revision) => revision.revisionNumber === 1);
  expect(
    (first?.geometry as { label: { widthMm: number } }).label.widthMm,
  ).toBe(60);

  // Reloading reads the same series back, oldest first.
  await page.reload();
  await page.getByRole("button", { name: "Open Avery L7160" }).click();
  await expect(revisions.getByRole("row")).toHaveCount(3);
  await expect(
    revisions.getByRole("row", { name: /Revision 1/ }),
  ).toContainText("60 × 38");
  await revisions.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-14-3.png` });

  expect(consoleErrors).toEqual([]);
});

test("offers no save while the entered geometry is refused", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);

  // A sheet 20 mm wider than the parts that make it up cannot be described.
  await fillConsistentSheet(page, [["Sheet width", "230"]]);
  await page.getByRole("button", { name: "Check measurements" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "This sheet cannot be described as entered.",
  );
  await expect(
    page.getByRole("button", { name: "Save as a new sheet layout" }),
  ).toHaveCount(0);
  expect(await readDurableRevisions(page)).toEqual([]);
  await page.screenshot({ path: `${SCREENSHOTS}TASK-14-4.png` });

  expect(consoleErrors).toEqual([]);
});
