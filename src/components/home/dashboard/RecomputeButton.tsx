"use client";

/**
 * RecomputeButton : secondary editorial button that relaunches a slow computation.
 * Disabled with a spinning icon while busy.
 */

import { Icon } from "@iconify/react";

interface RecomputeButtonProps {
  label: string;
  busy: boolean;
  onClick: () => void;
}

export function RecomputeButton({ label, busy, onClick }: RecomputeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="border-editorial-line bg-editorial-2 hover:border-editorial-accent hover:text-editorial-accent inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[var(--editorial-line)] disabled:hover:text-white"
    >
      <Icon
        icon="lucide:refresh-cw"
        className={`size-4 ${busy ? "animate-spin motion-reduce:animate-none" : ""}`.trim()}
        aria-hidden
      />
      {label}
    </button>
  );
}
