import { useCallback, useEffect, useState } from "react";
import type { SheetLayoutRepository } from "./SheetLayoutRepository";
import type { ResolvedSheetLayout } from "./resolveSheetLayout";
import type {
  SavedSheetLayoutRevision,
  SheetLayoutRecord,
  SheetLayoutRevisionRecord,
} from "./SheetLayoutRecord";

/** Revisions always carry the layout they were read for, so a stale series is never shown under a different layout. */
interface LoadedRevisions {
  layoutId: string | null;
  records: SheetLayoutRevisionRecord[];
}

const NO_REVISIONS: LoadedRevisions = { layoutId: null, records: [] };

/**
 * Reads the saved layouts and the revisions of the one being viewed.
 *
 * Revisions are re-read from the repository after every save rather than
 * appended in memory: the durable series is the record of what exists, and
 * showing anything else would let the screen and the store disagree.
 */
export function useSheetLayouts(
  repository: SheetLayoutRepository,
  openLayoutId: string | null,
) {
  const [layouts, setLayouts] = useState<SheetLayoutRecord[]>([]);
  const [loadedRevisions, setLoadedRevisions] =
    useState<LoadedRevisions>(NO_REVISIONS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    repository
      .listLayouts()
      .then((result) => {
        if (!cancelled) {
          setLayouts(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load saved sheet layouts. Try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  useEffect(() => {
    if (!openLayoutId) {
      return;
    }
    let cancelled = false;
    repository
      .listRevisions(openLayoutId)
      .then((records) => {
        if (!cancelled) {
          setLoadedRevisions({ layoutId: openLayoutId, records });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load saved revisions. Try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repository, openLayoutId]);

  const refreshRevisions = useCallback(
    async (layoutId: string) => {
      setLoadedRevisions({
        layoutId,
        records: await repository.listRevisions(layoutId),
      });
    },
    [repository],
  );

  const createLayout = useCallback(
    async (name: string, resolved: ResolvedSheetLayout) => {
      const saved = await repository.createLayout(name, resolved);
      setLayouts((current) => [...current, saved.layout]);
      await refreshRevisions(saved.layout.id);
      return saved;
    },
    [repository, refreshRevisions],
  );

  const appendRevision = useCallback(
    async (
      layoutId: string,
      resolved: ResolvedSheetLayout,
    ): Promise<SavedSheetLayoutRevision> => {
      const saved = await repository.appendRevision(layoutId, resolved);
      setLayouts((current) =>
        current.map((layout) =>
          layout.id === layoutId ? saved.layout : layout,
        ),
      );
      await refreshRevisions(layoutId);
      return saved;
    },
    [repository, refreshRevisions],
  );

  return {
    layouts,
    // Nothing is shown for a layout whose revisions have not been read yet.
    revisions:
      loadedRevisions.layoutId === openLayoutId ? loadedRevisions.records : [],
    loaded,
    loadError,
    createLayout,
    appendRevision,
  };
}
