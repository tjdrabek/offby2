import type { ProjectRecord } from "./ProjectRecord";
import type { ProjectDraftRecord } from "./ProjectDraft";

const DATABASE_NAME = "diy-labels";
const DATABASE_VERSION = 2;
const PROJECTS_STORE_NAME = "projects";
const DRAFTS_STORE_NAME = "projectDrafts";

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          `IndexedDB request failed: ${request.error?.message ?? "unknown error"}`,
        ),
      );
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("IndexedDB is not available in this browser."),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
        db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DRAFTS_STORE_NAME)) {
        db.createObjectStore(DRAFTS_STORE_NAME, { keyPath: "projectId" });
      }
    };
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

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(storeName, mode);
    const result = await promisifyRequest(
      run(transaction.objectStore(storeName)),
    );
    await new Promise<void>((resolve, reject) => {
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
    return result;
  } finally {
    db.close();
  }
}

export function listProjectRecords(): Promise<ProjectRecord[]> {
  return withStore(PROJECTS_STORE_NAME, "readonly", (store) => store.getAll());
}

export function getProjectRecord(
  id: string,
): Promise<ProjectRecord | undefined> {
  return withStore(PROJECTS_STORE_NAME, "readonly", (store) => store.get(id));
}

export function putProjectRecord(record: ProjectRecord): Promise<void> {
  return withStore(PROJECTS_STORE_NAME, "readwrite", (store) =>
    store.put(record),
  ).then(() => undefined);
}

export function deleteProjectRecord(id: string): Promise<void> {
  return withStore(PROJECTS_STORE_NAME, "readwrite", (store) =>
    store.delete(id),
  );
}

/** Raw stored values: durable drafts may predate the current schema, so callers must validate. */
export function listProjectDrafts(): Promise<unknown[]> {
  return withStore(DRAFTS_STORE_NAME, "readonly", (store) => store.getAll());
}

export function putProjectDraft(record: ProjectDraftRecord): Promise<void> {
  return withStore(DRAFTS_STORE_NAME, "readwrite", (store) =>
    store.put(record),
  ).then(() => undefined);
}

export function deleteProjectDraft(projectId: string): Promise<void> {
  return withStore(DRAFTS_STORE_NAME, "readwrite", (store) =>
    store.delete(projectId),
  );
}

export function clearProjectDrafts(): Promise<void> {
  return withStore(DRAFTS_STORE_NAME, "readwrite", (store) => store.clear());
}
