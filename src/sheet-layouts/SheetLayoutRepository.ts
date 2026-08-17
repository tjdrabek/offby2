import type { ResolvedSheetLayout } from "./resolveSheetLayout";
import type {
  SavedSheetLayoutRevision,
  SheetLayoutRecord,
  SheetLayoutRevisionRecord,
  SheetLayoutRevisionRef,
} from "./SheetLayoutRecord";

/**
 * Durable storage for sheet layouts.
 *
 * Only validated geometry can be saved: both write operations take a
 * {@link ResolvedSheetLayout}, which nothing in the form's source-input types
 * can satisfy. Neither operation can edit an existing revision — the interface
 * has no such method, because a correction is a new revision.
 */
export interface SheetLayoutRepository {
  listLayouts(): Promise<SheetLayoutRecord[]>;
  getLayout(id: string): Promise<SheetLayoutRecord | undefined>;
  /** Creates a stable identity and its revision 1 as one durable unit. */
  createLayout(
    name: string,
    layout: ResolvedSheetLayout,
  ): Promise<SavedSheetLayoutRevision>;
  /** Appends the next monotonically numbered revision under an existing identity. */
  appendRevision(
    layoutId: string,
    layout: ResolvedSheetLayout,
  ): Promise<SavedSheetLayoutRevision>;
  /** Reads one exact revision, which never changes once saved. */
  getRevision(
    ref: SheetLayoutRevisionRef,
  ): Promise<SheetLayoutRevisionRecord | undefined>;
  /** Every revision of one layout, oldest first. */
  listRevisions(layoutId: string): Promise<SheetLayoutRevisionRecord[]>;
}
