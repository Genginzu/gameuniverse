"use client";

/**
 * MarkPlayingButton : "I'm playing it" pill over a suggested card of
 * "Continue playing" (always visible: it marks the card as a suggestion).
 */

import { Icon } from "@iconify/react";

interface MarkPlayingButtonProps {
  label: string;
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
}

export function MarkPlayingButton({ label, ariaLabel, disabled, onClick }: MarkPlayingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="bg-editorial-bg/85 border-editorial-accent/60 text-editorial-accent hover:bg-editorial-accent/20 focus-visible:outline-editorial-accent absolute top-2 left-2 z-[5] inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed px-4 text-sm font-semibold backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
    >
      <Icon icon="lucide:gamepad-2" className="size-4" aria-hidden />
      {label}
    </button>
  );
}
