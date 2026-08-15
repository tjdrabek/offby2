import { useCallback, useEffect, useRef, useState } from "react";
import { describeError } from "./describeError";
import {
  activateWaitingWorker,
  observeWaitingWorker,
  type ServiceWorkerUpdateState,
} from "./serviceWorkerUpdate";
import type { FlushPendingWork } from "./pendingWork";

export interface UseServiceWorkerUpdateOptions {
  /** The active registration, or null while there is none. */
  registration?: ServiceWorkerRegistration | null;
  /** Injectable for tests; defaults to `navigator.serviceWorker`. */
  container?: ServiceWorkerContainer | null;
  /** Must resolve before the waiting worker is allowed to take over. */
  flushPendingWork?: FlushPendingWork;
  /** Injectable for tests; defaults to `window.location.reload()`. */
  reload?: () => void;
}

export interface ServiceWorkerUpdate {
  state: ServiceWorkerUpdateState;
  /** Makes open work durable and, only then, activates the waiting worker. */
  activate: () => Promise<void>;
  /** Keeps the current version running; the waiting worker is left alone. */
  dismiss: () => void;
}

function resolveContainer(
  container: ServiceWorkerContainer | null | undefined,
): ServiceWorkerContainer | null {
  if (container !== undefined) return container;
  if (typeof navigator === "undefined") return null;
  return navigator.serviceWorker ?? null;
}

/**
 * Turns the service-worker update lifecycle into host state and performs at
 * most one controlled reload, which happens only after the user explicitly
 * accepted an update and the open changes were made durable.
 */
export function useServiceWorkerUpdate(
  options: UseServiceWorkerUpdateOptions = {},
): ServiceWorkerUpdate {
  const { registration = null, flushPendingWork, reload } = options;
  const container = resolveContainer(options.container);

  const [state, setState] = useState<ServiceWorkerUpdateState>({
    status: "idle",
  });
  const acceptedRef = useRef(false);
  const reloadedRef = useRef(false);

  useEffect(() => {
    if (!registration) return;

    return observeWaitingWorker(registration, (waiting) => {
      setState((current) => {
        if (!waiting) {
          // An accepted activation keeps its state until the reload; anything
          // else has nothing left to announce once the worker is gone.
          return current.status === "activating" ? current : { status: "idle" };
        }
        // An accepted, in-progress, or explicitly postponed update must not be
        // re-announced by a later lifecycle event.
        return current.status === "idle" ? { status: "waiting" } : current;
      });
    });
  }, [registration]);

  useEffect(() => {
    if (!container) return;

    const handleControllerChange = () => {
      // Control can also change because another tab accepted the update. This
      // page keeps running in that case: it may hold work that is not durable,
      // and it never reloads without an explicit local acceptance.
      if (!acceptedRef.current || reloadedRef.current) return;
      reloadedRef.current = true;
      acceptedRef.current = false;
      if (reload) {
        reload();
      } else {
        window.location.reload();
      }
    };

    container.addEventListener("controllerchange", handleControllerChange);
    return () =>
      container.removeEventListener("controllerchange", handleControllerChange);
  }, [container, reload]);

  const activate = useCallback(async () => {
    if (!registration) return;
    setState({ status: "activating" });

    try {
      if (flushPendingWork) await flushPendingWork();
    } catch (error) {
      setState({
        status: "failed",
        reason: describeError(
          error,
          "Your changes could not be saved to this browser.",
        ),
      });
      return;
    }

    acceptedRef.current = true;
    try {
      activateWaitingWorker(registration);
    } catch (error) {
      acceptedRef.current = false;
      setState({
        status: "failed",
        reason: describeError(error, "The update could not be started."),
      });
    }
  }, [registration, flushPendingWork]);

  const dismiss = useCallback(() => {
    setState({ status: "dismissed" });
  }, []);

  return { state, activate, dismiss };
}
