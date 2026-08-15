import { describe, expect, it } from "vitest";
import { detectProjectRecovery } from "./projectRecovery";
import { createFakeProjectRepository } from "./testing/fakeProjectRepository";

describe("detectProjectRecovery", () => {
  it("is clean when no draft has ever been saved", async () => {
    const repository = createFakeProjectRepository();

    await expect(detectProjectRecovery(repository, [])).resolves.toEqual({
      kind: "clean",
    });
  });

  it("is recoverable when a saved draft differs from the committed project name", async () => {
    const repository = createFakeProjectRepository();
    const project = await repository.create("Pantry Jars");
    await repository.saveDraft(project.id, "Spice Jars");

    await expect(
      detectProjectRecovery(repository, [project]),
    ).resolves.toMatchObject({
      kind: "recoverable",
      projectId: project.id,
      projectName: "Pantry Jars",
      draftName: "Spice Jars",
    });
  });

  it("offers the most recently saved draft when several exist", async () => {
    const repository = createFakeProjectRepository();
    const older = await repository.create("Pantry Jars");
    const newer = await repository.create("Herb Jars");
    await repository.saveDraft(older.id, "Old Draft");
    await repository.saveDraft(newer.id, "New Draft");

    await expect(
      detectProjectRecovery(repository, [older, newer]),
    ).resolves.toMatchObject({
      kind: "recoverable",
      projectId: newer.id,
      draftName: "New Draft",
    });
  });

  it("is clean and self-heals when the draft matches the committed name", async () => {
    const repository = createFakeProjectRepository();
    const project = await repository.create("Pantry Jars");
    await repository.saveDraft(project.id, "Pantry Jars");

    await expect(detectProjectRecovery(repository, [project])).resolves.toEqual(
      { kind: "clean" },
    );
    await expect(repository.listDrafts()).resolves.toEqual([]);
  });

  it("is clean and clears the marker when the draft's project no longer exists", async () => {
    const repository = createFakeProjectRepository();
    await repository.saveDraft("deleted", "Spice Jars");

    await expect(detectProjectRecovery(repository, [])).resolves.toEqual({
      kind: "clean",
    });
    await expect(repository.listDrafts()).resolves.toEqual([]);
  });

  it("is unreadable, leaving the durable project untouched, when saved data is malformed", async () => {
    const repository = createFakeProjectRepository({
      listDrafts: async () => [
        { projectId: "p1", schemaVersion: 999, draftName: "" },
      ],
    });
    const project = await repository.create("Pantry Jars");

    await expect(detectProjectRecovery(repository, [project])).resolves.toEqual(
      {
        kind: "unreadable",
        reason: "Saved recovery data is in a format this app can't read.",
      },
    );
    await expect(repository.list()).resolves.toEqual([
      { id: project.id, name: "Pantry Jars" },
    ]);
  });

  it("is unreadable with an actionable reason when the store cannot be read", async () => {
    const repository = createFakeProjectRepository({
      listDrafts: async () => {
        throw new Error("IndexedDB is not available in this browser.");
      },
    });

    await expect(detectProjectRecovery(repository, [])).resolves.toEqual({
      kind: "unreadable",
      reason: "IndexedDB is not available in this browser.",
    });
  });
});
