/**
 * Tracks work that has been made in the UI but is not yet durable.
 *
 * The host layer uses this to answer one question before it lets a waiting
 * service worker replace the running page: "is everything the user has typed
 * already written to storage, and if not, can it be written now?"
 */

/** Completes any scheduled or in-flight writes; rejects if they cannot be made durable. */
export type FlushPendingWork = () => Promise<void>;

export interface PendingWorkTracker {
  /** Registers a flush callback and returns an unregister function. */
  register(flush: FlushPendingWork): () => void;
  /** Flushes every registered source, rejecting if any of them failed. */
  flush(): Promise<void>;
}

export function createPendingWorkTracker(): PendingWorkTracker {
  const sources = new Set<FlushPendingWork>();

  return {
    register(flush) {
      sources.add(flush);
      return () => {
        sources.delete(flush);
      };
    },
    async flush() {
      // Every source is attempted even when one fails: one unwritable draft
      // must not abandon the others, and the caller only needs to know that
      // something is still not durable.
      const results = await Promise.allSettled(
        [...sources].map((flushSource) => flushSource()),
      );
      const rejected = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (rejected) {
        throw rejected.reason;
      }
    },
  };
}
