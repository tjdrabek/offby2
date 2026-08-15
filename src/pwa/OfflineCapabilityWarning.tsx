import type { ServiceWorkerStatus } from "./serviceWorkerRegistration";
import "./OfflineCapabilityWarning.css";

interface OfflineCapabilityWarningProps {
  status: ServiceWorkerStatus;
}

/**
 * Non-destructive notice shown when the service worker could not be
 * registered. The application remains fully usable while online, so this states
 * exactly what is lost rather than blocking any workflow.
 */
function OfflineCapabilityWarning({ status }: OfflineCapabilityWarningProps) {
  if (status.status !== "failed") return null;

  return (
    <p className="offline-capability-warning" role="status">
      <span className="offline-capability-warning-label">Warning:</span> offline
      use is unavailable because the service worker could not be registered (
      {status.reason}). Everything else keeps working while you are online.
    </p>
  );
}

export default OfflineCapabilityWarning;
