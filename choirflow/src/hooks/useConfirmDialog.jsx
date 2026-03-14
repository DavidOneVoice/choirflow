import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "../Components/ConfirmDialog";

const DEFAULT_OPTIONS = {
  title: "Confirm action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "danger",
};

export function useConfirmDialog(defaults = {}) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback(
    (options = {}) => {
      const next = { ...DEFAULT_OPTIONS, ...defaults, ...options };
      setDialog(next);

      return new Promise((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [defaults],
  );

  return {
    confirm,
    confirmDialog: (
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        tone={dialog?.tone}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    ),
  };
}
