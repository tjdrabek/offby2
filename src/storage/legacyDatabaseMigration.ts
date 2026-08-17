/**
 * One-time move of local records out of the pre-rename database.
 *
 * The application's database was named after the project, and the project was
 * renamed. A name is part of a database's identity in IndexedDB, so opening the
 * new name yields an empty database rather than the operator's saved work. This
 * module carries the records across once and then removes the old database, so
 * the rename costs a returning operator nothing.
 *
 * Two rules keep a repeated or interrupted run safe:
 *
 * - A store is only filled when it is empty, so records already written under
 *   the new name are never overwritten by older ones.
 * - The legacy database is deleted only after the copy has committed, so an
 *   interrupted run leaves the records where they still are and retries.
 *
 * Probing is deliberately careful not to create the legacy database as a side
 * effect of looking for it: `indexedDB.open` with no version will happily
 * conjure an empty one, which would then look like a migration that found
 * nothing rather than one that never needed to run.
 */

import {
  PROJECTS_STORE,
  PROJECT_DRAFTS_STORE,
  SHEET_LAYOUTS_STORE,
  SHEET_LAYOUT_REVISIONS_STORE,
  promisifyRequest,
} from "./databaseStores";

/** The name the database carried before the project was renamed to offby2. */
export const LEGACY_DATABASE_NAME = "diy-labels";

/**
 * Every store the legacy database could hold. A store missing from an older
 * version is skipped rather than treated as an error: version 1 predates the
 * sheet-layout stores entirely.
 */
const MIGRATED_STORES: readonly string[] = [
  PROJECTS_STORE,
  PROJECT_DRAFTS_STORE,
  SHEET_LAYOUTS_STORE,
  SHEET_LAYOUT_REVISIONS_STORE,
];

type StoreContents = ReadonlyMap<string, readonly unknown[]>;

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(
        new Error(
          `Could not delete the ${name} database: ${request.error?.message ?? "unknown error"}`,
        ),
      );
    // Another tab still holds the legacy database open. Leaving it in place is
    // correct: the copy is idempotent, so the next run removes it.
    request.onblocked = () => resolve();
  });
}

/**
 * True when a database of this name exists, without creating one.
 *
 * `indexedDB.databases()` is the direct answer where it exists. Where it does
 * not, opening with no version and watching for an upgrade tells us the same
 * thing — an upgrade means we just created it — and the accidental creation is
 * undone before returning.
 */
async function databaseExists(name: string): Promise<boolean> {
  if (typeof indexedDB.databases === "function") {
    try {
      const databases = await indexedDB.databases();
      return databases.some((database) => database.name === name);
    } catch {
      // Fall through to the probe below rather than assume either answer.
    }
  }

  const created = await new Promise<boolean>((resolve, reject) => {
    let wasCreated = false;
    const request = indexedDB.open(name);
    request.onupgradeneeded = () => {
      wasCreated = true;
    };
    request.onsuccess = () => {
      request.result.close();
      resolve(wasCreated);
    };
    request.onerror = () =>
      reject(
        new Error(
          `Could not inspect the ${name} database: ${request.error?.message ?? "unknown error"}`,
        ),
      );
    request.onblocked = () => resolve(false);
  });

  if (created) {
    await deleteDatabase(name);
    return false;
  }
  return true;
}

/** Opens an existing database at whatever version it already holds. */
function openExisting(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          `Could not open the ${name} database: ${request.error?.message ?? "unknown error"}`,
        ),
      );
    request.onblocked = () =>
      reject(new Error(`Opening the ${name} database was blocked.`));
  });
}

/** Reads every migratable store the legacy database actually contains. */
async function readLegacyContents(legacy: IDBDatabase): Promise<StoreContents> {
  const present = MIGRATED_STORES.filter((store) =>
    legacy.objectStoreNames.contains(store),
  );
  const contents = new Map<string, readonly unknown[]>();
  if (present.length === 0) {
    return contents;
  }

  const transaction = legacy.transaction(present, "readonly");
  for (const store of present) {
    const records = await promisifyRequest<unknown[]>(
      transaction.objectStore(store).getAll(),
    );
    if (records.length > 0) {
      contents.set(store, records);
    }
  }
  return contents;
}

/**
 * Writes the legacy records into the current database, skipping any store that
 * already holds records of its own.
 *
 * Every migrated store uses an in-line key, so `put` needs no explicit key and
 * a record keeps the identity it was saved under.
 */
async function writeInto(
  current: IDBDatabase,
  contents: StoreContents,
): Promise<void> {
  const stores = [...contents.keys()].filter((store) =>
    current.objectStoreNames.contains(store),
  );
  if (stores.length === 0) {
    return;
  }

  const transaction = current.transaction(stores, "readwrite");
  const settled = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        new Error(
          `Could not copy legacy records: ${transaction.error?.message ?? "unknown error"}`,
        ),
      );
    transaction.onabort = () =>
      reject(new Error("Copying legacy records was aborted."));
  });

  try {
    for (const store of stores) {
      const target = transaction.objectStore(store);
      const existing = await promisifyRequest<number>(target.count());
      if (existing > 0) {
        continue;
      }
      for (const record of contents.get(store) ?? []) {
        await promisifyRequest(target.put(record));
      }
    }
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // Already finished: nothing is left to undo.
    }
    settled.catch(() => undefined);
    throw error;
  }
  await settled;
}

/**
 * Moves any records held under the legacy name into `current`, then removes the
 * legacy database. Resolves without doing anything when there is nothing to
 * move, which is the case for every operator who has not used a build from
 * before the rename.
 */
export async function migrateLegacyDatabase(
  current: IDBDatabase,
): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }
  if (current.name === LEGACY_DATABASE_NAME) {
    return;
  }
  if (!(await databaseExists(LEGACY_DATABASE_NAME))) {
    return;
  }

  const legacy = await openExisting(LEGACY_DATABASE_NAME);
  let contents: StoreContents;
  try {
    contents = await readLegacyContents(legacy);
  } finally {
    legacy.close();
  }

  await writeInto(current, contents);
  await deleteDatabase(LEGACY_DATABASE_NAME);
}
