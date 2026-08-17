import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:5174/";
const OUT = ".scratch/shots";
mkdirSync(OUT, { recursive: true });

const errors = [];
let step = 0;
const shot = async (page, name) => {
  step += 1;
  const file = `${OUT}/${String(step).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SHOT ${file}`);
};

const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByRole("heading", { level: 1 }).waitFor();
console.log("H1:", await page.getByRole("heading", { level: 1 }).textContent());
console.log(
  "NAV:",
  (await page.getByRole("navigation", { name: "Primary" }).getByRole("link").allTextContents()).join(" | "),
);
await shot(page, "initial");

// Create
await page.getByLabel("Project name").fill("Kitchen Labels");
await page.getByRole("button", { name: "Create project" }).click();
await page.getByRole("button", { name: /Currently open: Kitchen Labels/ }).waitFor();
console.log("CREATED ok");
await shot(page, "created");

// Persistence across a full reload (IndexedDB, TASK-4)
await page.reload({ waitUntil: "networkidle" });
const survived = await page
  .getByRole("button", { name: "Open Kitchen Labels" })
  .isVisible()
  .catch(() => false);
console.log("PERSISTED AFTER RELOAD:", survived);
await shot(page, "after-reload");

// Rename
await page.getByRole("button", { name: "Open Kitchen Labels" }).click();
const renameBox = page.getByRole("textbox").nth(1);
await renameBox.fill("Pantry Labels");
await page.getByRole("button", { name: /^Rename|Save/ }).first().click();
await page.getByText(/renamed to "Pantry Labels"/).waitFor({ timeout: 5000 }).catch(() => {});
console.log("RENAMED ->", await page.getByRole("list", { name: "Projects" }).textContent());
await shot(page, "renamed");

// Second destination
const links = page.getByRole("navigation", { name: "Primary" }).getByRole("link");
if ((await links.count()) > 1) {
  await links.nth(1).click();
  await page.waitForTimeout(300);
  console.log("SECOND DEST H1:", await page.getByRole("heading", { level: 1 }).textContent());
  console.log("SECOND DEST BODY:", (await page.locator("main").innerText()).slice(0, 200));
  await shot(page, "second-destination");
  await links.nth(0).click();
  await page.waitForTimeout(300);
}

// Delete confirm dialog
await page.getByRole("button", { name: /^Delete / }).first().click();
await page.getByText("Delete project?").waitFor();
await shot(page, "delete-dialog");
await page.getByRole("button", { name: "Delete", exact: true }).click();
await page.getByText("No projects yet").waitFor();
console.log("DELETED ok");
await shot(page, "deleted");

console.log("CONSOLE ERRORS:", errors.length ? JSON.stringify(errors, null, 2) : "none");
await browser.close();
