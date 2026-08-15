import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

/**
 * Fixtures for the project lifecycle, whose acceptance criteria all involve
 * restarting the browser. A context is the only honest stand-in for a restart,
 * so each session owns its own context (and therefore its own IndexedDB);
 * storage only ever travels forward through `restartSession`, never sideways
 * between tests.
 */

export interface LifecycleSession {
  context: BrowserContext;
  page: Page;
}

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

export interface SessionOptions {
  storageState?: StorageState;
  /** Collects console errors from the moment the page exists, including startup. */
  consoleErrors?: string[];
}

/** Opens an isolated session on the projects destination. */
export async function openSession(
  browser: Browser,
  baseURL: string,
  { storageState, consoleErrors }: SessionOptions = {},
): Promise<LifecycleSession> {
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();
  if (consoleErrors) {
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
  }
  await page.goto("/#/projects");
  await expect(
    page.getByRole("heading", { name: "Projects", level: 1 }),
  ).toBeVisible();
  return { context, page };
}

/**
 * Snapshots the session's IndexedDB, closes it, and reopens the application in
 * a fresh context carrying that storage — a real browser restart from the
 * application's point of view. The old session is unusable afterwards.
 */
export async function restartSession(
  session: LifecycleSession,
  browser: Browser,
  baseURL: string,
  options: Omit<SessionOptions, "storageState"> = {},
): Promise<LifecycleSession> {
  const storageState = await session.context.storageState({ indexedDB: true });
  await session.context.close();
  return openSession(browser, baseURL, { ...options, storageState });
}

/** Creates a project through the visible form and waits for it to open. */
export async function createProject(page: Page, name: string) {
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(
    page.getByRole("heading", { name: `Editing ${name}` }),
  ).toBeVisible();
}

/** Renames the open project and waits for the committed name to be visible. */
export async function saveRename(page: Page, name: string) {
  await page.getByLabel("Rename project").fill(name);
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(
    page.getByRole("heading", { name: `Editing ${name}` }),
  ).toBeVisible();
}

/**
 * Types a rename without saving it, returning once the draft is durable.
 * Waiting on the stored draft rather than on the debounce delay keeps this
 * tied to the outcome that recovery actually depends on.
 */
export async function typeUnsavedRename(page: Page, name: string) {
  await page.getByLabel("Rename project").fill(name);
  await expect.poll(() => readDurableDraftNames(page)).toContain(name);
}

/** The page's "Project status" announcements, as an accessible-name locator. */
export function projectStatus(page: Page) {
  return page.getByRole("status", { name: "Project status" });
}

export interface DurableProject {
  id: string;
  name: string;
}

/**
 * Reads the durable project records straight out of IndexedDB. Names are
 * visible in the UI but identifiers are not, and identity surviving a restart
 * is exactly what has to be proven.
 */
export async function readDurableProjects(
  page: Page,
): Promise<DurableProject[]> {
  const records = (await readStore(page, "projects")) as DurableProject[];
  return records
    .map(({ id, name }) => ({ id, name }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

/** The unsaved rename markers currently held in durable storage. */
export async function readDurableDraftNames(page: Page): Promise<string[]> {
  const drafts = (await readStore(page, "projectDrafts")) as {
    draftName: string;
  }[];
  return drafts.map((draft) => draft.draftName);
}

/**
 * Reads one object store of the application database without upgrading it, so
 * a store the application has not created yet reads as empty rather than
 * failing or altering the schema under test.
 */
function readStore(page: Page, storeName: string): Promise<unknown[]> {
  return page.evaluate(
    (name) =>
      new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open("diy-labels");
        open.onerror = () =>
          reject(new Error("Could not open the diy-labels database."));
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(name)) {
            db.close();
            resolve([]);
            return;
          }
          const getAll = db
            .transaction(name, "readonly")
            .objectStore(name)
            .getAll();
          getAll.onsuccess = () => {
            db.close();
            resolve(getAll.result as unknown[]);
          };
          getAll.onerror = () => {
            db.close();
            reject(new Error(`Could not read the ${name} store.`));
          };
        };
      }),
    storeName,
  );
}
