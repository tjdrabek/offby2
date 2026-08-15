import type { ProjectRecord } from "./ProjectRecord";

const DATABASE_NAME = "diy-labels";
const DATABASE_VERSION = 1;
const STORE_NAME = "projects";

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
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
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const result = await promisifyRequest(
      run(transaction.objectStore(STORE_NAME)),
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
  return withStore("readonly", (store) => store.getAll());
}

export function getProjectRecord(
  id: string,
): Promise<ProjectRecord | undefined> {
  return withStore("readonly", (store) => store.get(id));
}

export function putProjectRecord(record: ProjectRecord): Promise<void> {
  return withStore("readwrite", (store) => store.put(record)).then(
    () => undefined,
  );
}

export function deleteProjectRecord(id: string): Promise<void> {
  return withStore("readwrite", (store) => store.delete(id));
}
