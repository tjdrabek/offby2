/**
 * Service worker registration for the application host layer.
 *
 * Registration is best-effort: offline capability is an enhancement, so a
 * failure is reported to the caller as data rather than thrown. Nothing here
 * touches rendering or durable records.
 */

import { describeError } from "./describeError";

/** Emitted by the production build at the origin root by vite-plugin-pwa. */
export const SERVICE_WORKER_URL = "/sw.js";

/** The whole origin, matching the manifest `scope` and `start_url`. */
export const SERVICE_WORKER_SCOPE = "/";

export type ServiceWorkerStatus =
  /** Registration has not been attempted yet. */
  | { status: "pending" }
  /** Deliberately not attempted (development builds have no worker). */
  | { status: "disabled" }
  /** The browser has no service worker support; the app still works online. */
  | { status: "unsupported" }
  | {
      status: "registered";
      scope: string;
      /** Carried so the host can observe this registration's update lifecycle. */
      registration: ServiceWorkerRegistration;
    }
  | { status: "failed"; reason: string };

export interface RegisterServiceWorkerOptions {
  /** Defaults to production-only, since only the build emits a worker. */
  enabled?: boolean;
  scriptUrl?: string;
  scope?: string;
  /** Injectable for tests; defaults to `navigator.serviceWorker`. */
  container?: ServiceWorkerContainer;
}

/**
 * Registers the application service worker under {@link SERVICE_WORKER_SCOPE}.
 * Resolves with the outcome and never rejects, so callers can render a warning
 * instead of handling an exception.
 */
export async function registerServiceWorker(
  options: RegisterServiceWorkerOptions = {},
): Promise<ServiceWorkerStatus> {
  const {
    enabled = import.meta.env.PROD,
    scriptUrl = SERVICE_WORKER_URL,
    scope = SERVICE_WORKER_SCOPE,
  } = options;

  if (!enabled) return { status: "disabled" };

  const container =
    options.container ??
    (typeof navigator === "undefined" ? undefined : navigator.serviceWorker);
  if (!container) return { status: "unsupported" };

  try {
    const registration = await container.register(scriptUrl, { scope });
    return { status: "registered", scope: registration.scope, registration };
  } catch (error) {
    return {
      status: "failed",
      reason: describeError(
        error,
        "The browser rejected the service worker registration.",
      ),
    };
  }
}
