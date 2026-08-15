import { useEffect, useRef } from "react";

interface DiscardDraftConfirmDialogProps {
  draftName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DiscardDraftConfirmDialog({
  draftName,
  pending,
  onCancel,
  onConfirm,
}: DiscardDraftConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div className="project-modal-overlay">
      <div
        className="project-modal-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-draft-title"
      >
        <h2 id="discard-draft-title">Discard unsaved changes?</h2>
        <p>{`Discard the unsaved rename to "${draftName}"? This only removes the saved draft, not your project.`}</p>
        <div className="project-modal-actions">
          <button type="button" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            ref={confirmRef}
            className="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiscardDraftConfirmDialog;
