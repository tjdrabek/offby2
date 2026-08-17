import type { SheetLayoutRepository } from "../SheetLayoutRepository";
import {
  FIRST_REVISION_NUMBER,
  createSheetLayoutRecord,
  createSheetLayoutRevisionRecord,
  withLatestRevision,
  type SheetLayoutRecord,
  type SheetLayoutRevisionRecord,
} from "../SheetLayoutRecord";

/**
 * In-memory {@link SheetLayoutRepository} for tests; override any method to
 * simulate failures.
 *
 * It goes through the same record factories as the durable implementation, so
 * the save-time geometry refusal and the immutability of stored revisions hold
 * here too.
 */
export function createFakeSheetLayoutRepository(
  overrides: Partial<SheetLayoutRepository> = {},
): SheetLayoutRepository {
  let layouts: SheetLayoutRecord[] = [];
  let revisions: SheetLayoutRevisionRecord[] = [];
  let nextId = 0;
  // Monotonic stand-in for Date.now(), which is too coarse to order writes
  // made within the same millisecond.
  let clock = 0;

  function requireLayout(id: string): SheetLayoutRecord {
    const found = layouts.find((layout) => layout.id === id);
    if (!found) {
      throw new Error(`Sheet layout not found: ${id}`);
    }
    return found;
  }

  return {
    async listLayouts() {
      return [...layouts];
    },
    async getLayout(id) {
      return layouts.find((layout) => layout.id === id);
    },
    async createLayout(name, resolved) {
      const now = ++clock;
      const record = createSheetLayoutRecord(`sl${nextId++}`, name, now);
      const revision = createSheetLayoutRevisionRecord(
        { layoutId: record.id, revisionNumber: FIRST_REVISION_NUMBER },
        resolved,
        now,
      );
      layouts = [...layouts, record];
      revisions = [...revisions, revision];
      return { layout: record, revision };
    },
    async appendRevision(layoutId, resolved) {
      const now = ++clock;
      const existing = requireLayout(layoutId);
      const number = existing.latestRevisionNumber + 1;
      const revision = createSheetLayoutRevisionRecord(
        { layoutId, revisionNumber: number },
        resolved,
        now,
      );
      const updated = withLatestRevision(existing, number, now);
      layouts = layouts.map((layout) =>
        layout.id === layoutId ? updated : layout,
      );
      revisions = [...revisions, revision];
      return { layout: updated, revision };
    },
    async getRevision(ref) {
      return revisions.find(
        (revision) =>
          revision.layoutId === ref.layoutId &&
          revision.revisionNumber === ref.revisionNumber,
      );
    },
    async listRevisions(layoutId) {
      return revisions
        .filter((revision) => revision.layoutId === layoutId)
        .sort((a, b) => a.revisionNumber - b.revisionNumber);
    },
    ...overrides,
  };
}
