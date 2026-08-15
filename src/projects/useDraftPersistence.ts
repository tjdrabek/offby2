import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ProjectRepository } from "./ProjectRepository";

/** Long enough to avoid a write per keystroke, short enough to survive a crash. */
export const DRAFT_DEBOUNCE_MS = 400;

interface PendingDraft {
  projectId: string;
  /** null means "the draft matches the saved name", i.e. remove the marker. */
  draftName: string | null;
}

export interface DraftPersistence {
  /** Records the latest unsaved name and schedules a durable write. */
  record: (projectId: string, draftName: string | null) => void;
  /**
   * Completes any scheduled or in-flight write. Rejects when the draft is
   * still not durable, so callers can refuse to discard the page.
   */
  flush: () => Promise<void>;
}

/**
 * Owns the debounced, durable persistence of in-progress project drafts.
 *
 * Background writes are deliberately silent — a failure must not interrupt
 * typing — but a failed value stays pending, so the next {@link
 * DraftPersistence.flush} retries it and reports the failure to whoever needs
 * to know the draft is safe.
 */
export function useDraftPersistence(
  repository: ProjectRepository,
  debounceMs: number = DRAFT_DEBOUNCE_MS,
): DraftPersistence {
  const pendingRef = useRef<PendingDraft | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const cancelScheduledWrite = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const write = useCallback(
    async (pending: PendingDraft) => {
      const request =
        pending.draftName === null
          ? repository.clearDraft(pending.projectId)
          : repository.saveDraft(pending.projectId, pending.draftName);

      const tracked = request.then(() => {
        // Only the value this write carried may be cleared; anything recorded
        // while it was in flight is still pending.
        if (pendingRef.current === pending) pendingRef.current = null;
      });
      inFlightRef.current = tracked;
      await tracked;
    },
    [repository],
  );

  const record = useCallback(
    (projectId: string, draftName: string | null) => {
      pendingRef.current = { projectId, draftName };
      cancelScheduledWrite();
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        const pending = pendingRef.current;
        if (!pending) return;
        void write(pending).catch(() => undefined);
      }, debounceMs);
    },
    [cancelScheduledWrite, debounceMs, write],
  );

  const flush = useCallback(async () => {
    cancelScheduledWrite();
    const inFlight = inFlightRef.current;
    // A rejected in-flight write leaves its value pending, and the retry below
    // is what reports whether the draft is durable.
    if (inFlight) await inFlight.catch(() => undefined);
    const pending = pendingRef.current;
    if (pending) await write(pending);
  }, [cancelScheduledWrite, write]);

  useEffect(() => cancelScheduledWrite, [cancelScheduledWrite]);

  return useMemo(() => ({ record, flush }), [record, flush]);
}
