import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createIndexedDbSheetLayoutRepository } from "./IndexedDbSheetLayoutRepository";
import {
  SheetLayoutSaveRefusedError,
  createSheetLayoutRevisionRecord,
  isSheetLayoutRevisionRecord,
} from "./SheetLayoutRecord";
import {
  addSheetLayoutRecord,
  getSheetLayoutRecord,
  listSheetLayoutRevisionRecords,
} from "./sheetLayoutsDatabase";
import {
  contradictorySheetLayout,
  resolvedSheetLayout,
} from "./testing/sheetLayoutFixtures";
import {
  SHEET_LAYOUT_REVISIONS_STORE,
  withStore,
} from "../storage/database";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("reading revisions saved under schema 1", () => {
  /** Writes a revision in the shape schema 1 used: one derivation, own field. */
  async function seedSchemaOne(layoutId: string) {
    const repository = createIndexedDbSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout({ marginLeft: "" }),
    );
    const { derivations, ...rest } = created.revision;
    await withStore(SHEET_LAYOUT_REVISIONS_STORE, "readwrite", (store) =>
      store.put({ ...rest, schemaVersion: 1, derivation: derivations[0] }),
    );
    return { repository, layoutId: layoutId ?? created.layout.id, created };
  }

  it("upgrades a single revision on the way out", async () => {
    const { repository, created } = await seedSchemaOne("");
    const revision = await repository.getRevision({
      layoutId: created.layout.id,
      revisionNumber: created.revision.revisionNumber,
    });

    expect(revision).toBeDefined();
    expect(isSheetLayoutRevisionRecord(revision)).toBe(true);
    expect(revision?.derivations.map((one) => one.field)).toEqual([
      "marginLeft",
    ]);
  });

  it("upgrades revisions when listing them", async () => {
    const { repository, created } = await seedSchemaOne("");
    const revisions = await repository.listRevisions(created.layout.id);

    expect(revisions).toHaveLength(1);
    expect(revisions[0].derivations).toHaveLength(1);
  });

  it("drops a revision it still cannot read after upgrading", async () => {
    const { repository, created } = await seedSchemaOne("");
    await withStore(SHEET_LAYOUT_REVISIONS_STORE, "readwrite", (store) =>
      store.put({
        layoutId: created.layout.id,
        revisionNumber: 2,
        schemaVersion: 99,
        createdAt: 1,
        geometry: {},
        sources: {},
        derivations: [],
      }),
    );

    const revisions = await repository.listRevisions(created.layout.id);

    // The readable revision survives; the one from a future schema does not
    // arrive pretending to be readable.
    expect(revisions.map((one) => one.revisionNumber)).toEqual([1]);
  });
});

describe("IndexedDbSheetLayoutRepository", () => {
  it("lists no sheet layouts in a fresh database", async () => {
    const repository = createIndexedDbSheetLayoutRepository();
    await expect(repository.listLayouts()).resolves.toEqual([]);
  });

  it("creates a stable identity and its revision 1", async () => {
    const repository = createIndexedDbSheetLayoutRepository();

    const saved = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );

    expect(saved.layout.id).toBeTruthy();
    expect(saved.layout.name).toBe("Avery L7160");
    expect(saved.layout.latestRevisionNumber).toBe(1);
    expect(saved.revision.revisionNumber).toBe(1);
    expect(saved.revision.layoutId).toBe(saved.layout.id);
    expect(saved.revision.geometry.label.widthMm).toBe(60);
    await expect(repository.listLayouts()).resolves.toEqual([saved.layout]);
  });

  it("appends the next revision under the same identity", async () => {
    const repository = createIndexedDbSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );

    // 210 = 10 + 3 × 59 + 2 × 6.5 + 10.
    const appended = await repository.appendRevision(
      created.layout.id,
      resolvedSheetLayout({ labelWidth: "59", horizontalGap: "6.5" }),
    );

    expect(appended.layout.id).toBe(created.layout.id);
    expect(appended.layout.createdAt).toBe(created.layout.createdAt);
    expect(appended.layout.latestRevisionNumber).toBe(2);
    expect(appended.revision.revisionNumber).toBe(2);
    expect(appended.revision.geometry.label.widthMm).toBe(59);
  });

  it("keeps revision 1 byte-for-byte identical after a later save and a reload", async () => {
    const first = createIndexedDbSheetLayoutRepository();
    const created = await first.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );
    const original = JSON.stringify(created.revision);

    await first.appendRevision(
      created.layout.id,
      resolvedSheetLayout({ labelWidth: "59", horizontalGap: "6.5" }),
    );

    // A fresh repository instance simulates the app restarting: the fake
    // IndexedDB backing store is not reset, only the in-memory objects are.
    const second = createIndexedDbSheetLayoutRepository();
    const reloaded = await second.getRevision({
      layoutId: created.layout.id,
      revisionNumber: 1,
    });
    const revisions = await second.listRevisions(created.layout.id);

    expect(JSON.stringify(reloaded)).toBe(original);
    expect(revisions).toHaveLength(2);
    expect(revisions.map((revision) => revision.revisionNumber)).toEqual([
      1, 2,
    ]);
    expect(revisions[0].geometry.label.widthMm).toBe(60);
    expect(revisions[1].geometry.label.widthMm).toBe(59);
    expect(revisions.every(isSheetLayoutRevisionRecord)).toBe(true);
  });

  it("reads an exact revision rather than whatever is latest", async () => {
    const repository = createIndexedDbSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );
    const ref = { layoutId: created.layout.id, revisionNumber: 1 };

    await repository.appendRevision(
      created.layout.id,
      // 297 = 9.5 + 7 × 35 + 6 × 5.5 + 9.5.
      resolvedSheetLayout({ labelHeight: "35", verticalGap: "5.5" }),
    );
    const referenced = await repository.getRevision(ref);
    const latest = await repository.getRevision({
      ...ref,
      revisionNumber: created.layout.latestRevisionNumber + 1,
    });

    expect(referenced?.geometry.label.heightMm).toBe(38);
    expect(latest?.geometry.label.heightMm).toBe(35);
  });

  it("resolves nothing for a revision that was never saved", async () => {
    const repository = createIndexedDbSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );

    await expect(
      repository.getRevision({
        layoutId: created.layout.id,
        revisionNumber: 2,
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects appending to an unknown layout", async () => {
    const repository = createIndexedDbSheetLayoutRepository();

    await expect(
      repository.appendRevision("missing", resolvedSheetLayout()),
    ).rejects.toThrow(/Sheet layout not found/);
  });

  it("refuses to save geometry that cannot describe a sheet", async () => {
    const repository = createIndexedDbSheetLayoutRepository();

    await expect(
      repository.createLayout("Impossible", contradictorySheetLayout()),
    ).rejects.toThrow(SheetLayoutSaveRefusedError);
    await expect(repository.listLayouts()).resolves.toEqual([]);
  });

  it("refuses a refused revision without advancing the layout's numbering", async () => {
    const repository = createIndexedDbSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );

    await expect(
      repository.appendRevision(created.layout.id, contradictorySheetLayout()),
    ).rejects.toThrow(SheetLayoutSaveRefusedError);

    const stored = await getSheetLayoutRecord(created.layout.id);
    expect(stored?.latestRevisionNumber).toBe(1);
    await expect(
      repository.listRevisions(created.layout.id),
    ).resolves.toHaveLength(1);
  });

  it("refuses to overwrite an existing layout ID plus revision number", async () => {
    const repository = createIndexedDbSheetLayoutRepository();
    const created = await repository.createLayout(
      "Avery L7160",
      resolvedSheetLayout(),
    );
    const duplicate = createSheetLayoutRevisionRecord(
      { layoutId: created.layout.id, revisionNumber: 1 },
      resolvedSheetLayout({ labelWidth: "59", horizontalGap: "6.5" }),
      Date.now(),
    );

    await expect(
      addSheetLayoutRecord(created.layout, duplicate),
    ).rejects.toThrow();

    // Neither the identity nor the revision it already had was replaced.
    const revisions = await listSheetLayoutRevisionRecords(created.layout.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].geometry.label.widthMm).toBe(60);
  });

  it("orders layouts by creation, tie-breaking on id", async () => {
    const repository = createIndexedDbSheetLayoutRepository();

    const first = await repository.createLayout(
      "A4 21-up",
      resolvedSheetLayout(),
    );
    const second = await repository.createLayout(
      "A4 21-up (revised)",
      resolvedSheetLayout(),
    );

    const listed = await repository.listLayouts();
    expect(listed.map((layout) => layout.id)).toEqual(
      [first.layout, second.layout]
        .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
        .map((layout) => layout.id),
    );
  });
});
