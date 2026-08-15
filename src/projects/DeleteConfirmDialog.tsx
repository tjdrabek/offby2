import { useEffect, useRef } from "react";

interface DeleteConfirmDialogProps {
  projectName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  projectName,
  pending,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div className="project-delete-overlay">
      <div
        className="project-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
      >
        <h2 id="delete-project-title">Delete project?</h2>
        <p>{`Delete "${projectName}"? This cannot be undone.`}</p>
        <div className="project-delete-actions">
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
