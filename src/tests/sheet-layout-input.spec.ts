import { test, expect, type Page } from "@playwright/test";
import { SCREENSHOTS } from "./support/paths.js";

/** Every dimensional field, in the unit the form is currently showing. */
const MEASUREMENTS: readonly [string, string][] = [
  ["Sheet width", "210"],
  ["Sheet height", "297"],
  ["Label width", "63.5"],
  ["Label height", "38.1"],
  ["Top margin", "10"],
  ["Right margin", "7"],
  ["Bottom margin", "10"],
  ["Left margin", "7"],
  ["Horizontal gap", "2.5"],
  ["Vertical gap", "0"],
];

async function openSheetLayouts(page: Page) {
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

async function fillCompleteSheet(page: Page, suffix = "mm") {
  for (const [label, value] of MEASUREMENTS) {
    await page.getByLabel(`${label} (${suffix})`).fill(value);
  }
  await page.getByLabel("Rows").fill("7");
  await page.getByLabel("Columns").fill("3");
}

test("captures every uniform-grid dimension with units and a stated corner radius", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);
  const check = page.getByRole("button", { name: "Check measurements" });

  // Nothing entered yet: the form must refuse and say what is wrong per field.
  await check.click();
  await expect(page.getByRole("alert")).toContainText(
    "12 measurements still need attention",
  );
  await expect(page.getByLabel("Sheet width (mm)")).toBeFocused();
  await expect(page.getByLabel("Sheet width (mm)")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Rows")).toHaveAccessibleDescription(
    /Enter a value\./,
  );
  await page.screenshot({ path: `${SCREENSHOTS}TASK-10-1.png` });

  await fillCompleteSheet(page);

  // Switching unit restates every field without discarding what was typed.
  await page.getByLabel("Measurement unit").selectOption("in");
  await expect(page.getByLabel("Sheet width (in)")).toHaveValue("210");
  await expect(page.getByLabel("Sheet width (mm)")).toHaveCount(0);
  await page.getByLabel("Measurement unit").selectOption("mm");

  // A claimed radius needs a measurement behind it.
  await page.getByRole("radio", { name: "Known radius", exact: true }).check();
  await check.click();
  await expect(
    page.getByLabel("Corner radius (mm)"),
  ).toHaveAccessibleDescription(/Enter a value\./);
  await page.getByLabel("Corner radius (mm)").fill("2");
  await page.screenshot({ path: `${SCREENSHOTS}TASK-10-2.png` });

  await check.click();
  await expect(
    page.getByRole("status", { name: "Sheet layout status" }),
  ).toHaveText(
    "Measurements captured: 7 rows by 3 columns. Corner radius: Known radius.",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({ path: `${SCREENSHOTS}TASK-10-3.png` });

  expect(consoleErrors).toEqual([]);
});

test("keeps unknown corners distinct from square corners and refuses unusable counts", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);
  const check = page.getByRole("button", { name: "Check measurements" });
  const radiusGroup = page.getByRole("group", { name: "Corner radius" });

  // Four separate states, each described in text rather than by colour.
  await expect(radiusGroup.getByRole("radio")).toHaveCount(4);
  await expect(
    radiusGroup.getByRole("radio", { name: "Square corners (radius is zero)" }),
  ).toBeChecked();
  await radiusGroup.getByRole("radio", { name: "Unknown radius" }).check();
  await expect(page.getByLabel("Corner radius (mm)")).toHaveCount(0);
  await expect(
    radiusGroup.getByRole("radio", { name: "Square corners (radius is zero)" }),
  ).not.toBeChecked();

  await fillCompleteSheet(page);
  await page.getByLabel("Rows").fill("2.5");
  await check.click();

  // The unusable entry stays on screen exactly as typed.
  await expect(page.getByLabel("Rows")).toHaveValue("2.5");
  await expect(page.getByLabel("Rows")).toBeFocused();
  await expect(page.getByLabel("Rows")).toHaveAccessibleDescription(
    /Rows must be a whole number\./,
  );
  await page.screenshot({ path: `${SCREENSHOTS}TASK-10-4.png` });

  await page.getByLabel("Rows").fill("7");
  await check.click();
  await expect(
    page.getByRole("status", { name: "Sheet layout status" }),
  ).toHaveText(
    "Measurements captured: 7 rows by 3 columns. Corner radius: Unknown radius.",
  );

  expect(consoleErrors).toEqual([]);
});

test("normalizes imperial and metric entries into the same millimetres", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);
  const check = page.getByRole("button", { name: "Check measurements" });
  const normalized = page.getByRole("table", {
    name: "Normalized measurements",
  });

  await fillCompleteSheet(page);
  await check.click();
  await expect(normalized.locator('[data-field-mm="labelWidth"]')).toHaveText(
    "63.5 mm",
  );
  await normalized.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-11-1.png` });

  // The same label, written as an imperial fraction, normalizes identically.
  await page.getByLabel("Measurement unit").selectOption("in");
  await page.getByLabel("Label width (in)").fill("2 1/2");
  await check.click();
  await expect(normalized.locator('[data-field-mm="labelWidth"]')).toHaveText(
    "63.5 mm",
  );
  await expect(
    normalized.getByRole("row", { name: /Label width/ }),
  ).toContainText("2 1/2 in");
  await normalized.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-11-2.png` });

  expect(consoleErrors).toEqual([]);
});

test("refuses unparsable measurements and keeps captured values stable", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);
  const check = page.getByRole("button", { name: "Check measurements" });
  const normalized = page.getByRole("table", {
    name: "Normalized measurements",
  });

  await fillCompleteSheet(page);
  await page.getByLabel("Sheet width (mm)").fill("21O");
  await check.click();

  // The unusable entry stays exactly as typed, with its own correction.
  await expect(page.getByLabel("Sheet width (mm)")).toHaveValue("21O");
  await expect(page.getByLabel("Sheet width (mm)")).toBeFocused();
  await expect(page.getByLabel("Sheet width (mm)")).toHaveAccessibleDescription(
    /Enter a decimal measurement such as/,
  );
  await expect(normalized).toHaveCount(0);
  await page.screenshot({ path: `${SCREENSHOTS}TASK-11-3.png` });

  await page.getByLabel("Sheet width (mm)").fill("210");
  await check.click();
  await expect(normalized.locator('[data-field-mm="sheetWidth"]')).toHaveText(
    "210 mm",
  );

  // Changing the display preference restates the entry fields only; the
  // captured millimetres are unchanged and are additionally shown in inches.
  await page.getByLabel("Measurement unit").selectOption("in");
  await expect(page.getByLabel("Sheet width (in)")).toHaveValue("210");
  await expect(normalized.locator('[data-field-mm="sheetWidth"]')).toHaveText(
    "210 mm",
  );
  await expect(
    normalized.getByRole("columnheader", { name: "Shown in in" }),
  ).toBeVisible();
  await expect(
    normalized.getByRole("row", { name: /Sheet width/ }),
  ).toContainText("8.2677 in");
  await normalized.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SCREENSHOTS}TASK-11-4.png` });

  expect(consoleErrors).toEqual([]);
});

test("offers no unsupported media and says which media is supported", async ({
  page,
}) => {
  const consoleErrors = await openSheetLayouts(page);

  // The only selector on the form is the measurement unit; there is no media
  // type to choose, so circular, roll, or non-uniform sheets are unreachable.
  const selects = page.getByRole("combobox");
  await expect(selects).toHaveCount(1);
  await expect(selects.getByRole("option")).toHaveText([
    "Millimetres (mm)",
    "Centimetres (cm)",
    "Inches (in)",
  ]);
  await expect(
    page.getByText(/circular, oval, roll, continuous/i),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
