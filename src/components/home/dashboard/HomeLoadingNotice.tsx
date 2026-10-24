"use client";

/**
 * HomeLoadingNotice : visible "work in progress" message for slow sections.
 *
 * Shows a spinner + message immediately, then a reassurance hint once the
 * request exceeds `slowAfterMs`. Announced politely to screen readers.
 */

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

interface HomeLoadingNoticeProps {
  message: string;
  slowMessage: string;
  slowAfterMs?: number;
}

const DEFAULT_SLOW_AFTER_MS = 6000;

export function HomeLoadingNotice({
  message,
  slowMessage,
  slowAfterMs = DEFAULT_SLOW_AFTER_MS,
}: HomeLoadingNoticeProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), slowAfterMs);
    return () => clearTimeout(timer);
  }, [slowAfterMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-editorial-line bg-editorial-2 flex items-start gap-3 rounded-2xl border px-4 py-3 sm:items-center"
    >
      <Icon
        icon="lucide:loader-circle"
        className="text-editorial-accent mt-0.5 size-5 shrink-0 animate-spin motion-reduce:animate-none sm:mt-0"
        aria-hidden
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-semibold text-white sm:text-base">{message}</p>
        {isSlow && <p className="text-editorial-muted text-sm">{slowMessage}</p>}
      </div>
    </div>
  );
}
