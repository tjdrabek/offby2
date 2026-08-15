import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createIndexedDbProjectRepository } from "./IndexedDbProjectRepository";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function failingOpen(message: string) {
  return (() => {
    const request = {} as IDBOpenDBRequest;
    queueMicrotask(() => {
      Object.defineProperty(request, "error", {
        value: new DOMException(message, "UnknownError"),
      });
      request.onerror?.(new Event("error"));
    });
    return request;
  }) as typeof indexedDB.open;
}

describe("IndexedDbProjectRepository", () => {
  it("lists no projects in a fresh database", async () => {
    const repository = createIndexedDbProjectRepository();
    await expect(repository.list()).resolves.toEqual([]);
  });

  it("creates a project with a stable identity", async () => {
    const repository = createIndexedDbProjectRepository();
    const project = await repository.create("Pantry Jars");

    expect(project.name).toBe("Pantry Jars");
    expect(project.id).toBeTruthy();
    await expect(repository.list()).resolves.toEqual([project]);
  });

  it("reloads the same identity and name from a new repository instance", async () => {
    const first = createIndexedDbProjectRepository();
    const created = await first.create("Pantry Jars");
    await first.rename(created.id, "Spice Jars");

    // A fresh repository instance simulates the app restarting: the fake
    // IndexedDB backing store is not reset, only the in-memory objects are.
    const second = createIndexedDbProjectRepository();
    const reloaded = await second.list();

    expect(reloaded).toEqual([{ id: created.id, name: "Spice Jars" }]);
  });

  it("renames a project without changing its id", async () => {
    const repository = createIndexedDbProjectRepository();
    const created = await repository.create("Pantry Jars");

    const renamed = await repository.rename(created.id, "Spice Jars");

    expect(renamed.id).toBe(created.id);
    expect(renamed.name).toBe("Spice Jars");
  });

  it("rejects renaming an unknown project", async () => {
    const repository = createIndexedDbProjectRepository();
    await expect(repository.rename("missing", "New name")).rejects.toThrow(
      "Project not found: missing",
    );
  });

  it("removes a project", async () => {
    const repository = createIndexedDbProjectRepository();
    const created = await repository.create("Pantry Jars");

    await repository.remove(created.id);

    await expect(repository.list()).resolves.toEqual([]);
  });

  it("rejects removing an unknown project", async () => {
    const repository = createIndexedDbProjectRepository();
    await expect(repository.remove("missing")).rejects.toThrow(
      "Project not found: missing",
    );
  });

  it("keeps a saved draft readable from a new repository instance", async () => {
    const first = createIndexedDbProjectRepository();
    const created = await first.create("Pantry Jars");
    await first.saveDraft(created.id, "Spice Jars");

    const second = createIndexedDbProjectRepository();

    await expect(second.listDrafts()).resolves.toMatchObject([
      { projectId: created.id, draftName: "Spice Jars" },
    ]);
  });

  it("clears only the named draft, leaving the project and other drafts intact", async () => {
    const repository = createIndexedDbProjectRepository();
    const kept = await repository.create("Pantry Jars");
    const cleared = await repository.create("Herb Jars");
    await repository.saveDraft(kept.id, "Spice Jars");
    await repository.saveDraft(cleared.id, "Tea Jars");

    await repository.clearDraft(cleared.id);

    await expect(repository.listDrafts()).resolves.toMatchObject([
      { projectId: kept.id, draftName: "Spice Jars" },
    ]);
    await expect(repository.list()).resolves.toEqual(
      expect.arrayContaining([kept, cleared]),
    );
  });

  it("orders same-millisecond creations deterministically", async () => {
    const repository = createIndexedDbProjectRepository();
    await repository.create("Pantry Jars");
    await repository.create("Herb Jars");

    const first = await repository.list();
    const second = await createIndexedDbProjectRepository().list();

    expect(second).toEqual(first);
  });

  it("clears every draft without touching projects", async () => {
    const repository = createIndexedDbProjectRepository();
    const created = await repository.create("Pantry Jars");
    await repository.saveDraft(created.id, "Spice Jars");

    await repository.clearAllDrafts();

    await expect(repository.listDrafts()).resolves.toEqual([]);
    await expect(repository.list()).resolves.toEqual([created]);
  });

  it("surfaces an actionable error and leaves no trace when IndexedDB fails to open", async () => {
    vi.spyOn(globalThis.indexedDB, "open").mockImplementation(
      failingOpen("storage unavailable"),
    );
    const repository = createIndexedDbProjectRepository();

    await expect(repository.create("Pantry Jars")).rejects.toThrow(
      /Could not open the local database/,
    );

    vi.restoreAllMocks();
    await expect(repository.list()).resolves.toEqual([]);
  });
});
