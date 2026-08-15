import { useEffect, useRef, useState } from "react";
import type { ProjectRecoveryStatus } from "./projectRecovery";
import DiscardDraftConfirmDialog from "./DiscardDraftConfirmDialog";

interface ProjectRecoveryBannerProps {
  status: Exclude<ProjectRecoveryStatus, { kind: "clean" }>;
  pending: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  onDismissUnreadable: () => void;
}

function ProjectRecoveryBanner({
  status,
  pending,
  onRecover,
  onDiscard,
  onDismissUnreadable,
}: ProjectRecoveryBannerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

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
      <section
        className="project-recovery-banner"
        aria-labelledby="recovery-heading"
      >
        <h2 id="recovery-heading" tabIndex={-1} ref={headingRef}>
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
    <section
      className="project-recovery-banner"
      aria-labelledby="recovery-heading"
    >
      <h2 id="recovery-heading" tabIndex={-1} ref={headingRef}>
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
          onClick={() => setConfirmingDiscard(true)}
          disabled={pending}
        >
          Discard
        </button>
      </div>
      {confirmingDiscard && (
        <DiscardDraftConfirmDialog
          draftName={status.draftName}
          pending={pending}
          onCancel={() => setConfirmingDiscard(false)}
          onConfirm={() => {
            setConfirmingDiscard(false);
            onDiscard();
          }}
        />
      )}
    </section>
  );
}

export default ProjectRecoveryBanner;
