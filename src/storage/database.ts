/**
 * The application's single local database.
 *
 * Every feature stores its durable records here rather than opening a database
 * of its own: one connection, one version, and one upgrade path, so a schema
 * change can never leave two halves of the workspace on different versions.
 *
 * Feature modules import the store helpers, never `indexedDB` itself, and the
 * UI imports neither.
 */

import {
  PROJECTS_STORE,
  PROJECT_DRAFTS_STORE,
  SHEET_LAYOUTS_STORE,
  SHEET_LAYOUT_REVISIONS_STORE,
  promisifyRequest,
} from "./databaseStores";
import { migrateLegacyDatabase } from "./legacyDatabaseMigration";

export {
  PROJECTS_STORE,
  PROJECT_DRAFTS_STORE,
  SHEET_LAYOUTS_STORE,
  SHEET_LAYOUT_REVISIONS_STORE,
  promisifyRequest,
} from "./databaseStores";

/**
 * Named after the project. Records saved under the previous name are carried
 * across on first open by legacyDatabaseMigration.ts rather than abandoned.
 */
const DATABASE_NAME = "offby2";

/**
 * Bumped whenever a store is added or reshaped. The upgrade handler creates
 * anything missing, so an older database gains new stores without losing the
 * records it already holds.
 */
const DATABASE_VERSION = 3;

/** Creates any store this version expects and leaves existing records alone. */
function upgrade(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
    db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(PROJECT_DRAFTS_STORE)) {
    db.createObjectStore(PROJECT_DRAFTS_STORE, { keyPath: "projectId" });
  }
  if (!db.objectStoreNames.contains(SHEET_LAYOUTS_STORE)) {
    db.createObjectStore(SHEET_LAYOUTS_STORE, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(SHEET_LAYOUT_REVISIONS_STORE)) {
    // The compound key is the revision's identity, so storing a revision that
    // already exists is refused by the store itself rather than by a check a
    // caller could forget to make.
    const revisions = db.createObjectStore(SHEET_LAYOUT_REVISIONS_STORE, {
      keyPath: ["layoutId", "revisionNumber"],
    });
    revisions.createIndex("layoutId", "layoutId", { unique: false });
  }
}

function connect(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("IndexedDB is not available in this browser."),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => upgrade(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          `Could not open the local database: ${request.error?.message ?? "unknown error"}`,
        ),
      );
    request.onblocked = () =>
      reject(
        new Error(
          "Could not open the local database: blocked by another open connection.",
        ),
      );
  });
}

/**
 * The migration runs at most once per page load. Every later open awaits the
 * same settled promise, so a failed migration is not retried against a caller
 * that is only trying to read.
 */
let migration: Promise<void> | null = null;

/**
 * Opens the database, having first carried across anything saved under the
 * project's previous name.
 *
 * A migration failure is deliberately not fatal: the records under the old name
 * are left untouched for a later attempt, and the caller still gets a usable
 * connection rather than an application that cannot start.
 */
export async function openDatabase(): Promise<IDBDatabase> {
  const db = await connect();
  migration ??= migrateLegacyDatabase(db).catch((error: unknown) => {
    console.warn("Could not migrate records from the previous database.", error);
  });
  await migration;
  return db;
}

/** Lets a test observe a fresh migration rather than a memoized earlier one. */
export function resetLegacyMigrationForTests(): void {
  migration = null;
}

/**
 * Runs `work` inside one transaction and resolves only once that transaction
 * has committed, so a caller can never observe a durable result that is still
 * in flight.
 *
 * `work` may await requests it issues on this transaction — and nothing else,
 * because awaiting anything outside it lets the transaction auto-commit early.
 * A rejection aborts the transaction, which is what makes a multi-store write
 * all-or-nothing.
 */
export async function withTransaction<T>(
  storeNames: string | readonly string[],
  mode: IDBTransactionMode,
  work: (transaction: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(
      typeof storeNames === "string" ? storeNames : [...storeNames],
      mode,
    );
    const settled = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          new Error(
            `IndexedDB transaction failed: ${transaction.error?.message ?? "unknown error"}`,
          ),
        );
      transaction.onabort = () =>
        reject(new Error("IndexedDB transaction was aborted."));
    });

    let result: T;
    try {
      result = await work(transaction);
    } catch (error) {
      // The write must not survive the failure of a later step in the same
      // unit of work; abort() is a no-op once the transaction has finished.
      try {
        transaction.abort();
      } catch {
        // Already finished: nothing is left to undo.
      }
      settled.catch(() => undefined);
      throw error;
    }
    await settled;
    return result;
  } finally {
    db.close();
  }
}

/** Single-store shorthand for the common case of one request. */
export function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return withTransaction(storeName, mode, (transaction) =>
    promisifyRequest(run(transaction.objectStore(storeName))),
  );
}
