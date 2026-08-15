/**
 * Service-worker update lifecycle, expressed as host state.
 *
 * A newly installed worker waits until every client using the old one goes
 * away. Nothing here decides *when* to let it through — that is the host's
 * job, and it happens only after the user accepts and open work is durable.
 */

export type ServiceWorkerUpdateState =
  /** No update is waiting. */
  | { status: "idle" }
  /** A new worker is installed and waiting for permission to take over. */
  | { status: "waiting" }
  /** The user chose "Later"; the waiting worker stays untouched. */
  | { status: "dismissed" }
  /** The user accepted; open work is being made durable before activation. */
  | { status: "activating" }
  /** Activation was refused because the update could not be applied safely. */
  | { status: "failed"; reason: string };

/** Understood by the generated worker (workbox), which calls `skipWaiting()`. */
export const SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" } as const;

/**
 * Reports whether the registration has a worker waiting, both now and whenever
 * that changes. Returns an unsubscribe function.
 */
export function observeWaitingWorker(
  registration: ServiceWorkerRegistration,
  onWaitingChange: (waiting: boolean) => void,
): () => void {
  const detachers: Array<() => void> = [];

  const notify = () => onWaitingChange(registration.waiting != null);

  const handleUpdateFound = () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener("statechange", notify);
    detachers.push(() => installing.removeEventListener("statechange", notify));
  };

  registration.addEventListener("updatefound", handleUpdateFound);
  detachers.push(() =>
    registration.removeEventListener("updatefound", handleUpdateFound),
  );

  // A worker can already be waiting from a previous visit, in which case no
  // further event will ever fire for it.
  notify();

  return () => {
    for (const detach of detachers) detach();
  };
}

/**
 * Asks the waiting worker to take over. Control actually changes later, when
 * the browser fires `controllerchange`.
 */
export function activateWaitingWorker(
  registration: ServiceWorkerRegistration,
): void {
  const waiting = registration.waiting;
  if (!waiting) {
    throw new Error("There is no waiting update to activate.");
  }
  waiting.postMessage(SKIP_WAITING_MESSAGE);
}
