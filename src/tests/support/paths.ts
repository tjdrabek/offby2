import { fileURLToPath } from "node:url";

/** Directory the task log links its UI verification screenshots from. */
export const SCREENSHOTS = fileURLToPath(
  new URL("../../../.agent/screenshots/", import.meta.url),
);
