"use client";

import { Icon } from "@iconify/react";

interface PostMenuProps {
  showMenu: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  deleteLabel: string;
  cancelLabel: string;
  confirmLabel: string;
}

export function PostMenu({
  showMenu,
  isDeleting,
  onToggle,
  onCancel,
  onConfirm,
  deleteLabel,
  cancelLabel,
  confirmLabel,
}: PostMenuProps) {
  if (!showMenu) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700/50 dark:hover:text-slate-300"
        aria-label={deleteLabel}
      >
        <Icon icon="lucide:more-horizontal" className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDeleting}
        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {isDeleting && <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />}
        <Icon icon="lucide:trash-2" className="h-3 w-3" />
        {confirmLabel}
      </button>
    </div>
  );
}
