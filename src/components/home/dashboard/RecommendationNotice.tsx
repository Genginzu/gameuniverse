"use client";

/**
 * RecommendationNotice : confirmation after an action on a recommendation
 * ("not interested", "added to library"), with an optional undo.
 * `message` holds the game title as a link (built by the caller with t.rich).
 */

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";

interface RecommendationNoticeProps {
  icon: string;
  message: ReactNode;
  undo?: { label: string; onClick: () => void };
}

export function RecommendationNotice({ icon, message, undo }: RecommendationNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-editorial-line bg-editorial-2 -mt-2 flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2"
    >
      <p className="flex min-w-0 items-center gap-2 text-sm text-white">
        <Icon icon={icon} className="text-editorial-muted size-4 shrink-0" aria-hidden />
        <span className="min-w-0">{message}</span>
      </p>
      {undo && (
        <button
          type="button"
          onClick={undo.onClick}
          className="text-editorial-accent hover:bg-editorial-accent/15 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors"
        >
          <Icon icon="lucide:undo-2" className="size-4" aria-hidden />
          {undo.label}
        </button>
      )}
    </div>
  );
}
