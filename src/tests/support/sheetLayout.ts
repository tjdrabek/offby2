import { expect, type Page } from "@playwright/test";

/**
 * Shared browser helpers for the sheet-layouts destination.
 *
 * Everything here drives the page through its visible, named controls, so a
 * spec asserts what a user can reach rather than how it is rendered.
 */

/** Opens the destination and collects console errors from before the first navigation. */
export async function openSheetLayouts(page: Page) {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  await page.goto("/#/sheet-layouts");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sheet layouts" }),
  ).toBeVisible();
  return consoleErrors;
}

export async function fillSheet(
  page: Page,
  values: readonly [string, string][],
  suffix: string,
  counts: { rows: string; columns: string },
) {
  for (const [label, value] of values) {
    await page.getByLabel(`${label} (${suffix})`).fill(value);
  }
  await page.getByLabel("Rows").fill(counts.rows);
  await page.getByLabel("Columns").fill(counts.columns);
}

/**
 * A sheet that satisfies both axis equations exactly, so clearing any single
 * field leaves one well-determined unknown.
 *
 * Horizontal: 210 = 10 + 3 × 60 + 2 × 5 + 10
 * Vertical:   297 = 9.5 + 7 × 38 + 6 × 2 + 9.5
 */
export const CONSISTENT: readonly [string, string][] = [
  ["Sheet width", "210"],
  ["Sheet height", "297"],
  ["Label width", "60"],
  ["Label height", "38"],
  ["Top margin", "9.5"],
  ["Right margin", "10"],
  ["Bottom margin", "9.5"],
  ["Left margin", "10"],
  ["Horizontal gap", "5"],
  ["Vertical gap", "2"],
];

/** Fills {@link CONSISTENT}, with any field replaced by an override. */
export async function fillConsistentSheet(
  page: Page,
  overrides: readonly [string, string][] = [],
) {
  const values = CONSISTENT.map(
    ([label, value]) =>
      [label, overrides.find(([field]) => field === label)?.[1] ?? value] as [
        string,
        string,
      ],
  );
  await fillSheet(page, values, "mm", { rows: "7", columns: "3" });
}
