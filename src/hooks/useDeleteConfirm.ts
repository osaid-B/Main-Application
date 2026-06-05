import { useState, useCallback } from "react";

interface DeleteConfirmState {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
}

const CLOSED: DeleteConfirmState = {
  isOpen: false,
  itemName: "",
  onConfirm: () => {},
};

export function useDeleteConfirm() {
  const [state, setState] = useState<DeleteConfirmState>(CLOSED);

  const openDeleteConfirm = useCallback(({
    itemName,
    onConfirm,
  }: {
    itemName: string;
    onConfirm: () => void;
  }) => {
    setState({ isOpen: true, itemName, onConfirm });
  }, []);

  const handleConfirm = useCallback(() => {
    const confirmFn = state.onConfirm;
    setState(CLOSED);   // close first
    confirmFn();        // then execute
  }, [state.onConfirm]);

  const handleCancel = useCallback(() => {
    // Only closes modal — no navigation, no side effects
    setState(CLOSED);
  }, []);

  return {
    deleteConfirmState: state,
    openDeleteConfirm,
    handleConfirm,
    handleCancel,
  };
}
