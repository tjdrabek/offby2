/**
 * A pointer to one exact sheet-layout revision.
 *
 * Separated from SheetLayoutRecord.ts because it is the one part of the record
 * vocabulary that belongs to the domain rather than to storage. A printer
 * profile must say which revision it was measured against, and saying so should
 * not drag the persistence layer — or its platform globals — along with it.
 *
 * This module is pure: it imports no React, DOM, IndexedDB, or PDF API.
 */

/** An exact revision. Nothing in it can drift when a later revision is saved. */
export interface SheetLayoutRevisionRef {
  layoutId: string;
  revisionNumber: number;
}

/** True when both references name the same revision. */
export function sameRevision(
  left: SheetLayoutRevisionRef,
  right: SheetLayoutRevisionRef,
): boolean {
  return (
    left.layoutId === right.layoutId &&
    left.revisionNumber === right.revisionNumber
  );
}
