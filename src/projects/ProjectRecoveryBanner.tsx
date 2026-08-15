import { useEffect, useId, useRef, useState } from "react";
import type { ProjectRecoveryStatus } from "./projectRecovery";
import ConfirmDialog from "../ui/ConfirmDialog";

interface ProjectRecoveryBannerProps {
  status: Exclude<ProjectRecoveryStatus, { kind: "clean" }>;
  pending: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  onDismissUnreadable: () => void;
  /** Where focus goes once the whole banner is gone. */
  focusFallback?: () => HTMLElement | null;
}

function ProjectRecoveryBanner({
  status,
  pending,
  onRecover,
  onDiscard,
  onDismissUnreadable,
  focusFallback,
}: ProjectRecoveryBannerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const discardTriggerRef = useRef<HTMLButtonElement>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const headingId = useId();

  // Detection resolves asynchronously, so only claim focus while the user has
  // not already started interacting; yanking focus mid-keystroke loses input.
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) {
      headingRef.current?.focus();
    }
  }, []);

  if (status.kind === "unreadable") {
    return (
      <section className="project-recovery-banner" aria-labelledby={headingId}>
        <h2 id={headingId} tabIndex={-1} ref={headingRef}>
          Saved recovery data couldn't be read
        </h2>
        <p>
          {`We couldn't read a saved draft from your last session: ${status.reason} Your saved projects are unaffected.`}
        </p>
        <button type="button" onClick={onDismissUnreadable} disabled={pending}>
          Clear saved recovery data
        </button>
      </section>
    );
  }

  return (
    <section className="project-recovery-banner" aria-labelledby={headingId}>
      <h2 id={headingId} tabIndex={-1} ref={headingRef}>
        Recover unsaved changes?
      </h2>
      <p>
        {`"${status.projectName}" has an unsaved rename to "${status.draftName}" from a previous session.`}
      </p>
      <div className="project-recovery-actions">
        <button type="button" onClick={onRecover} disabled={pending}>
          {`Recover "${status.draftName}"`}
        </button>
        <button
          type="button"
          ref={discardTriggerRef}
          onClick={() => setConfirmingDiscard(true)}
          disabled={pending}
        >
          Discard
        </button>
      </div>
      {confirmingDiscard && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          description={`Discard the unsaved rename to "${status.draftName}"? This only removes the saved draft, not your project.`}
          confirmLabel="Discard"
          destructive
          pending={pending}
          onCancel={() => setConfirmingDiscard(false)}
          onConfirm={() => {
            setConfirmingDiscard(false);
            onDiscard();
          }}
          // Confirming removes the whole banner, taking the trigger with it.
          restoreFocusFallback={() =>
            headingRef.current?.isConnected
              ? headingRef.current
              : (focusFallback?.() ?? null)
          }
        />
      )}
    </section>
  );
}

export default ProjectRecoveryBanner;
