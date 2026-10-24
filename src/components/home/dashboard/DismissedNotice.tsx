"use client";

/**
 * DismissedNotice : confirmation after a "not interested", with an undo.
 */

import { Icon } from "@iconify/react";

interface DismissedNoticeProps {
  message: string;
  undoLabel: string;
  onUndo: () => void;
}

export function DismissedNotice({ message, undoLabel, onUndo }: DismissedNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-editorial-line bg-editorial-2 -mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2"
    >
      <p className="flex min-w-0 items-center gap-2 text-sm text-white">
        <Icon icon="lucide:eye-off" className="text-editorial-muted size-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{message}</span>
      </p>
      <button
        type="button"
        onClick={onUndo}
        className="text-editorial-accent hover:bg-editorial-accent/15 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors"
      >
        <Icon icon="lucide:undo-2" className="size-4" aria-hidden />
        {undoLabel}
      </button>
    </div>
  );
}
