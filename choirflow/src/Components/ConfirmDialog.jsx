import { useEffect } from "react";
import "../styles/components/confirm-dialog.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true">
      <button
        className="confirm-dialog__backdrop"
        type="button"
        onClick={onCancel}
        aria-label="Close confirmation"
      />

      <div className="confirm-dialog__card card">
        <h2 className="confirm-dialog__title">{title}</h2>
        <p className="confirm-dialog__message muted">{message}</p>

        <div className="confirm-dialog__actions">
          <button className="btn ghost" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${tone === "danger" ? "danger" : "primary"}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
