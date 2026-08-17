import type { SheetLayoutRepository } from "./SheetLayoutRepository";
import {
  FIRST_REVISION_NUMBER,
  createSheetLayoutRecord,
  createSheetLayoutRevisionRecord,
  isSheetLayoutRevisionRecord,
  upgradeSheetLayoutRevisionRecord,
  withLatestRevision,
  type SheetLayoutRevisionRecord,
} from "./SheetLayoutRecord";
import {
  addSheetLayoutRecord,
  appendSheetLayoutRevisionRecord,
  getSheetLayoutRecord,
  getSheetLayoutRevisionRecord,
  listSheetLayoutRecords,
  listSheetLayoutRevisionRecords,
} from "./sheetLayoutsDatabase";

/**
 * Every stored revision passes through here on its way out.
 *
 * A record written by an older version is upgraded first, so a schema change
 * costs an operator nothing. One that still cannot be read afterwards is
 * dropped rather than handed on: the caller's type says the record is readable,
 * and returning something that only looks like one moves the failure somewhere
 * further away from the cause.
 */
function readRevision(value: unknown): SheetLayoutRevisionRecord | undefined {
  const upgraded = upgradeSheetLayoutRevisionRecord(value);
  return isSheetLayoutRevisionRecord(upgraded) ? upgraded : undefined;
}

/** Feature-oriented repository backed by IndexedDB; UI code never touches the database directly. */
export function createIndexedDbSheetLayoutRepository(): SheetLayoutRepository {
  return {
    async listLayouts() {
      const records = await listSheetLayoutRecords();
      // Tie-break on id: IndexedDB returns records in random UUID key order,
      // so createdAt alone leaves same-millisecond creations unordered.
      return records.sort(
        (a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id),
      );
    },
    getLayout(id) {
      return getSheetLayoutRecord(id);
    },
    async createLayout(name, layout) {
      const now = Date.now();
      const record = createSheetLayoutRecord(crypto.randomUUID(), name, now);
      // Built before anything is written, so refused geometry never reaches
      // storage and never creates an identity with no revision under it.
      const revision = createSheetLayoutRevisionRecord(
        { layoutId: record.id, revisionNumber: FIRST_REVISION_NUMBER },
        layout,
        now,
      );
      await addSheetLayoutRecord(record, revision);
      return { layout: record, revision };
    },
    appendRevision(layoutId, layout) {
      const now = Date.now();
      return appendSheetLayoutRevisionRecord(layoutId, (existing, number) => ({
        layout: withLatestRevision(existing, number, now),
        revision: createSheetLayoutRevisionRecord(
          { layoutId: existing.id, revisionNumber: number },
          layout,
          now,
        ),
      }));
    },
    async getRevision(ref) {
      return readRevision(await getSheetLayoutRevisionRecord(ref));
    },
    async listRevisions(layoutId) {
      const revisions = await listSheetLayoutRevisionRecords(layoutId);
      return revisions
        .map(readRevision)
        .filter((revision) => revision !== undefined)
        .sort((a, b) => a.revisionNumber - b.revisionNumber);
    },
  };
}
