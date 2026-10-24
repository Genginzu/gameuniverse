"use client";

import { useCallback, useRef, useState } from "react";

interface DeletableList<TRow> {
  remove: (row: TRow) => Promise<void>;
  checkUsage: (row: TRow) => Promise<number | undefined>;
}

interface DeleteFlowCallbacks<TRow> {
  onDeleted?: (row: TRow) => void;
  onError?: (error: unknown, row: TRow) => void;
}

export function useAdminDeleteFlow<TRow>(
  list: DeletableList<TRow>,
  { onDeleted, onError }: DeleteFlowCallbacks<TRow> = {}
) {
  const [target, setTarget] = useState<TRow | null>(null);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentTarget = useRef<TRow | null>(null);
  const { remove, checkUsage } = list;

  const request = useCallback(
    (row: TRow) => {
      currentTarget.current = row;
      setTarget(row);
      setUsageCount(undefined);
      checkUsage(row)
        .then((count) => {
          if (currentTarget.current === row) setUsageCount(count);
        })
        .catch(() => undefined);
    },
    [checkUsage]
  );

  const onClose = useCallback(() => {
    if (isDeleting) return;
    currentTarget.current = null;
    setTarget(null);
  }, [isDeleting]);

  const onConfirm = useCallback(async () => {
    if (!target) return;
    setIsDeleting(true);
    try {
      await remove(target);
      currentTarget.current = null;
      setTarget(null);
      onDeleted?.(target);
    } catch (error) {
      onError?.(error, target);
    } finally {
      setIsDeleting(false);
    }
  }, [target, remove, onDeleted, onError]);

  return {
    target,
    request,
    dialog: { isOpen: target !== null, usageCount, isDeleting, onConfirm, onClose },
  };
}
