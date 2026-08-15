import { useEffect, useState } from "react";
import {
  registerServiceWorker,
  type RegisterServiceWorkerOptions,
  type ServiceWorkerStatus,
} from "./serviceWorkerRegistration";

/**
 * Attempts service worker registration once after mount and reports the
 * outcome. Registration is awaited off the render path, so the application
 * renders identically whether or not it succeeds.
 */
export function useServiceWorkerRegistration(
  options: RegisterServiceWorkerOptions = {},
): ServiceWorkerStatus {
  const { enabled, scriptUrl, scope, container } = options;
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    status: "pending",
  });

  useEffect(() => {
    let cancelled = false;

    void registerServiceWorker({ enabled, scriptUrl, scope, container }).then(
      (result) => {
        if (!cancelled) setStatus(result);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, scriptUrl, scope, container]);

  return status;
}
