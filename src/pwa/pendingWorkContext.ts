import { createContext, useContext, useEffect } from "react";
import type { FlushPendingWork, PendingWorkTracker } from "./pendingWork";

/**
 * Lets any page contribute its unsaved work to the shell's durability check
 * without the shell knowing what that work is.
 */
export const PendingWorkContext = createContext<PendingWorkTracker | null>(
  null,
);

/**
 * Registers a flush callback for as long as the component is mounted. The
 * callback must be referentially stable, otherwise it re-registers on every
 * render.
 */
export function usePendingWorkRegistration(flush: FlushPendingWork): void {
  const tracker = useContext(PendingWorkContext);

  useEffect(() => {
    if (!tracker) return;
    return tracker.register(flush);
  }, [tracker, flush]);
}
