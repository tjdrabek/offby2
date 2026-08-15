import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";

/** PWA behaviour only exists in built output; these specs run against the preview build. */

export const SCREENSHOTS = fileURLToPath(
  new URL("../../../.agent/screenshots/", import.meta.url),
);

/**
 * Loads the app once online and returns only after the service worker is
 * activated and controlling the page, which is the "one successful load"
 * precondition for both offline startup and any later update.
 */
export async function loadOnceOnlineAndTakeControl(page: Page) {
  await page.goto("/#/projects");
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await page.reload();
  await expect.poll(() => controllerScriptUrl(page)).not.toEqual("");
}

/** The script URL of the worker currently controlling the page, or "". */
export async function controllerScriptUrl(page: Page): Promise<string> {
  try {
    return await page.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL ?? "",
    );
  } catch {
    // The page can be mid-navigation during a controlled reload; the caller
    // polls, so reporting "no controller yet" is correct rather than fatal.
    return "";
  }
}

/**
 * Installs a second worker script at the same scope. Because the existing
 * worker still controls this page, the new one stays waiting — exactly the
 * state a real deployment produces.
 */
export async function installWaitingUpdate(page: Page, version = "2") {
  await page.evaluate(
    (scriptUrl) =>
      navigator.serviceWorker
        .register(scriptUrl, { scope: "/" })
        .then(() => undefined),
    `/sw.js?update=${version}`,
  );

  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.serviceWorker
          .getRegistration("/")
          .then((registration) => registration?.waiting?.scriptURL ?? ""),
      ),
    )
    .toContain(`update=${version}`);
}
