import { useId } from "react";
import { useFocusTrap } from "./useFocusTrap";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Styles the confirm action as destructive; never the only signal. */
  destructive?: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  restoreFocusFallback?: () => HTMLElement | null;
}

/**
 * Modal confirmation shared by every destructive shell workflow. Focus starts
 * on Cancel — the non-destructive choice — stays inside while the dialog is
 * open, and returns to whatever opened it.
 */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending,
  onCancel,
  onConfirm,
  restoreFocusFallback,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>({
    // A dismissal mid-write would leave the user unsure what was committed.
    onEscape: () => {
      if (!pending) {
        onCancel();
      }
    },
    restoreFocusFallback,
  });

  return (
    <div className="confirm-dialog-overlay">
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? "destructive" : undefined}
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
