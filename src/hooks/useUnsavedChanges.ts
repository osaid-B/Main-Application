import { useBlocker } from "react-router";
import { useEffect, useCallback, useState } from "react";

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  onDiscardConfirm?: () => void;
}

interface UseUnsavedChangesResult {
  showDiscard: boolean;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
  requestClose: () => void;
}

export function useUnsavedChanges({
  isDirty,
  onDiscardConfirm,
}: UseUnsavedChangesOptions): UseUnsavedChangesResult {
  const [localShowDiscard, setLocalShowDiscard] = useState(false);
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const showDiscard = blocker.state === "blocked" || localShowDiscard;

  const confirmDiscard = useCallback(() => {
    setLocalShowDiscard(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else {
      onDiscardConfirm?.();
    }
  }, [blocker, onDiscardConfirm]);

  const cancelDiscard = useCallback(() => {
    setLocalShowDiscard(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setLocalShowDiscard(true);
    } else {
      onDiscardConfirm?.();
    }
  }, [isDirty, onDiscardConfirm]);

  return { showDiscard, confirmDiscard, cancelDiscard, requestClose };
}
