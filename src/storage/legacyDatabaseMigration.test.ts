import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  PROJECTS_STORE,
  PROJECT_DRAFTS_STORE,
  openDatabase,
  promisifyRequest,
  resetLegacyMigrationForTests,
  withStore,
} from "./database";
import { LEGACY_DATABASE_NAME } from "./legacyDatabaseMigration";

interface ProjectRow {
  id: string;
  name: string;
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetLegacyMigrationForTests();
});

/** Creates the legacy database with the stores and records it used to hold. */
function seedLegacyDatabase(
  projects: readonly ProjectRow[],
  drafts: readonly { projectId: string; draftName: string }[] = [],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LEGACY_DATABASE_NAME, 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      db.createObjectStore(PROJECT_DRAFTS_STORE, { keyPath: "projectId" });
    };
    request.onerror = () => reject(new Error("Could not seed the legacy database."));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(
        [PROJECTS_STORE, PROJECT_DRAFTS_STORE],
        "readwrite",
      );
      for (const project of projects) {
        transaction.objectStore(PROJECTS_STORE).put(project);
      }
      for (const draft of drafts) {
        transaction.objectStore(PROJECT_DRAFTS_STORE).put(draft);
      }
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () =>
        reject(new Error("Could not write the legacy records."));
    };
  });
}

function legacyDatabaseNames(): Promise<string[]> {
  return indexedDB
    .databases()
    .then((databases) =>
      databases
        .map((database) => database.name)
        .filter((name): name is string => Boolean(name)),
    );
}

function readProjects(): Promise<ProjectRow[]> {
  return withStore(PROJECTS_STORE, "readonly", (store) => store.getAll());
}

describe("legacy database migration", () => {
  it("carries records from the previous database name into the current one", async () => {
    await seedLegacyDatabase(
      [{ id: "p1", name: "Pantry Jars" }],
      [{ projectId: "p1", draftName: "Spice Jars" }],
    );

    const db = await openDatabase();
    db.close();

    await expect(readProjects()).resolves.toEqual([
      { id: "p1", name: "Pantry Jars" },
    ]);
    const drafts = await withStore(PROJECT_DRAFTS_STORE, "readonly", (store) =>
      store.getAll(),
    );
    expect(drafts).toEqual([{ projectId: "p1", draftName: "Spice Jars" }]);
  });

  it("removes the previous database once its records have been carried across", async () => {
    await seedLegacyDatabase([{ id: "p1", name: "Pantry Jars" }]);

    const db = await openDatabase();
    db.close();

    await expect(legacyDatabaseNames()).resolves.not.toContain(
      LEGACY_DATABASE_NAME,
    );
  });

  it("does not create a database under the previous name when none exists", async () => {
    const db = await openDatabase();
    db.close();

    await expect(readProjects()).resolves.toEqual([]);
    await expect(legacyDatabaseNames()).resolves.not.toContain(
      LEGACY_DATABASE_NAME,
    );
  });

  it("keeps records already saved under the current name", async () => {
    const first = await openDatabase();
    await promisifyRequest(
      first
        .transaction(PROJECTS_STORE, "readwrite")
        .objectStore(PROJECTS_STORE)
        .put({ id: "p1", name: "Current" }),
    );
    first.close();

    await seedLegacyDatabase([{ id: "p1", name: "Legacy" }]);
    resetLegacyMigrationForTests();

    const second = await openDatabase();
    second.close();

    await expect(readProjects()).resolves.toEqual([
      { id: "p1", name: "Current" },
    ]);
  });
});
