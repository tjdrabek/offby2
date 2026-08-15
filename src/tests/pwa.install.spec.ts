import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

/**
 * Installation readiness is a property of the production build only: the
 * manifest, the icons and the service worker are all emitted by `vite build`,
 * so these specs run against the preview server (see playwright.config.ts).
 */

const ORIGIN = "http://localhost:4173";

const SCREENSHOTS = fileURLToPath(
  new URL("../../.agent/screenshots/", import.meta.url),
);

test("links a manifest that declares installable application metadata", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#1b2a4a",
  );

  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);

  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "Reusable Label Printing",
    short_name: "Label Printing",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#1b2a4a",
    background_color: "#1b2a4a",
  });
  expect(manifest.description).toBeTruthy();

  const icons: { src: string; sizes: string; purpose?: string }[] =
    manifest.icons;
  expect(icons.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
  expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
});

test("serves every declared icon as a local same-origin PNG", async ({
  request,
}) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();

  for (const icon of manifest.icons as { src: string }[]) {
    // Nothing may resolve to an external durable asset.
    expect(new URL(icon.src, ORIGIN).origin).toBe(ORIGIN);

    const response = await request.get(icon.src);
    expect(response.ok(), `${icon.src} should be served`).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");

    const body = await response.body();
    expect(body.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
});

test("registers and is controlled by a service worker scoped to the origin", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");

  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, script: ready.active?.scriptURL ?? null };
  });
  expect(registration.scope).toBe(`${ORIGIN}/`);
  expect(registration.script).toBe(`${ORIGIN}/sw.js`);

  // Updates activate only through a reload, so the first load is intentionally
  // uncontrolled; the worker takes over on the next navigation.
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL ?? null,
      ),
    )
    .toBe(`${ORIGIN}/sw.js`);

  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  // The update live region is always mounted, but a healthy load has nothing
  // to announce in it and no capability warning at all.
  await expect(
    page.getByRole("status", { name: "Application updates" }),
  ).toBeEmpty();
  await expect(page.getByText("Warning:")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test("keeps the application usable and warns when registration fails", async ({
  page,
  context,
}) => {
  await context.route("**/sw.js", (route) => route.abort());

  await page.goto("/#/projects");

  // The application renders regardless of registration outcome.
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.getByLabel("Project name").fill("Offline-less Project");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(
    page.getByRole("heading", { name: "Editing Offline-less Project" }),
  ).toBeVisible();

  const warning = page.getByRole("status").filter({ hasText: "Warning:" });
  await expect(warning).toContainText("Warning:");
  await expect(warning).toContainText("offline use is unavailable");

  await page.screenshot({ path: `${SCREENSHOTS}TASK-6-3.png` });
});
