import type { Locator, Page } from "@playwright/test";

/**
 * Tabs until `target` holds focus, proving the control is reachable by keyboard
 * alone rather than focusing it programmatically. Throws with the currently
 * focused control if it never arrives, which is the useful failure message.
 */
export async function tabUntilFocused(
  page: Page,
  target: Locator,
  options: { shift?: boolean; maxPresses?: number } = {},
) {
  const { shift = false, maxPresses = 30 } = options;
  const key = shift ? "Shift+Tab" : "Tab";
  for (let press = 0; press <= maxPresses; press += 1) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
    await page.keyboard.press(key);
  }
  const reached = await page.evaluate(() => {
    const active = document.activeElement;
    return active ? `${active.tagName} "${active.textContent ?? ""}"` : "none";
  });
  throw new Error(
    `Target never received focus after ${maxPresses} ${key} presses; focus is on ${reached}`,
  );
}

/** Outline actually painted on the focused element, for focus-visibility checks. */
export async function focusedOutline(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return { style: "none", width: 0 };
    }
    const computed = getComputedStyle(active);
    return {
      style: computed.outlineStyle,
      width: Number.parseFloat(computed.outlineWidth),
    };
  });
}
