/**
 * Durable reads and writes for sheet layouts.
 *
 * The two writes are the interesting part. Both span the identity store and
 * the revision store inside a single transaction, so revision numbering can
 * never advance without the matching revision being stored: if the revision
 * cannot be written — because that layout ID and revision number already exist
 * — the identity's pointer is rolled back with it.
 */

import {
  SHEET_LAYOUTS_STORE,
  SHEET_LAYOUT_REVISIONS_STORE,
  promisifyRequest,
  withStore,
  withTransaction,
} from "../storage/database";
import type {
  SheetLayoutRecord,
  SheetLayoutRevisionRecord,
  SheetLayoutRevisionRef,
} from "./SheetLayoutRecord";

const BOTH_STORES = [SHEET_LAYOUTS_STORE, SHEET_LAYOUT_REVISIONS_STORE];

export function listSheetLayoutRecords(): Promise<SheetLayoutRecord[]> {
  return withStore(SHEET_LAYOUTS_STORE, "readonly", (store) => store.getAll());
}

export function getSheetLayoutRecord(
  id: string,
): Promise<SheetLayoutRecord | undefined> {
  return withStore(SHEET_LAYOUTS_STORE, "readonly", (store) => store.get(id));
}

export function getSheetLayoutRevisionRecord(
  ref: SheetLayoutRevisionRef,
): Promise<SheetLayoutRevisionRecord | undefined> {
  return withStore(SHEET_LAYOUT_REVISIONS_STORE, "readonly", (store) =>
    store.get([ref.layoutId, ref.revisionNumber]),
  );
}

export function listSheetLayoutRevisionRecords(
  layoutId: string,
): Promise<SheetLayoutRevisionRecord[]> {
  return withStore(SHEET_LAYOUT_REVISIONS_STORE, "readonly", (store) =>
    store.index("layoutId").getAll(layoutId),
  );
}

/**
 * Stores a new identity and its first revision together. `add` refuses an
 * existing layout ID, and the revision store's compound key refuses an
 * existing layout ID plus revision number, so neither can be overwritten.
 */
export async function addSheetLayoutRecord(
  layout: SheetLayoutRecord,
  revision: SheetLayoutRevisionRecord,
): Promise<void> {
  await withTransaction(BOTH_STORES, "readwrite", async (transaction) => {
    await promisifyRequest(
      transaction.objectStore(SHEET_LAYOUTS_STORE).add(layout),
    );
    await promisifyRequest(
      transaction.objectStore(SHEET_LAYOUT_REVISIONS_STORE).add(revision),
    );
  });
}

/**
 * Appends `revision` and advances the identity's pointer in the same
 * transaction, using `buildRevision` so the revision number is read and used
 * without any window in which another write could take it.
 */
export async function appendSheetLayoutRevisionRecord(
  layoutId: string,
  buildRevision: (
    layout: SheetLayoutRecord,
    revisionNumber: number,
  ) => { layout: SheetLayoutRecord; revision: SheetLayoutRevisionRecord },
): Promise<{ layout: SheetLayoutRecord; revision: SheetLayoutRevisionRecord }> {
  return withTransaction(BOTH_STORES, "readwrite", async (transaction) => {
    const layouts = transaction.objectStore(SHEET_LAYOUTS_STORE);
    const existing = await promisifyRequest<SheetLayoutRecord | undefined>(
      layouts.get(layoutId),
    );
    if (!existing) {
      throw new Error(`Sheet layout not found: ${layoutId}`);
    }
    const next = buildRevision(existing, existing.latestRevisionNumber + 1);
    // The revision is stored first: if its key is taken, the transaction is
    // aborted before the pointer that would have claimed the number is written.
    await promisifyRequest(
      transaction.objectStore(SHEET_LAYOUT_REVISIONS_STORE).add(next.revision),
    );
    await promisifyRequest(layouts.put(next.layout));
    return next;
  });
}
