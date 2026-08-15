import type { ServiceWorkerUpdateState } from "./serviceWorkerUpdate";
import "./UpdateNotice.css";

interface UpdateNoticeProps {
  state: ServiceWorkerUpdateState;
  onUpdate: () => void;
  onDismiss: () => void;
}

/**
 * Announces a waiting update and offers the only two honest choices: apply it
 * now (which first makes open work durable and then reloads once), or keep
 * working on the current version.
 *
 * The live region is always mounted so a later message is announced without
 * moving focus away from whatever the user is doing.
 */
function UpdateNotice({ state, onUpdate, onDismiss }: UpdateNoticeProps) {
  const visible =
    state.status === "waiting" ||
    state.status === "activating" ||
    state.status === "failed";

  return (
    <div
      className="update-notice-region"
      role="status"
      aria-label="Application updates"
    >
      {visible && (
        <div className={`update-notice update-notice-${state.status}`}>
          {state.status === "waiting" && (
            <p className="update-notice-message">
              <span className="update-notice-label">Update available:</span> a
              newer version of this application is ready. Updating saves your
              open changes first and then reloads this page.
            </p>
          )}
          {state.status === "activating" && (
            <p className="update-notice-message">
              <span className="update-notice-label">Updating:</span> saving your
              open changes before reloading.
            </p>
          )}
          {state.status === "failed" && (
            <p className="update-notice-message">
              <span className="update-notice-label">Update blocked:</span> your
              open changes could not be saved, so this page was left running (
              {state.reason}). Nothing was lost — try again once the problem is
              resolved.
            </p>
          )}
          <div className="update-notice-actions">
            <button
              type="button"
              onClick={onUpdate}
              disabled={state.status === "activating"}
            >
              {state.status === "failed" ? "Try updating again" : "Update now"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={state.status === "activating"}
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateNotice;
