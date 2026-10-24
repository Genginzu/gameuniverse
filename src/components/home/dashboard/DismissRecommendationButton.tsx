"use client";

/**
 * DismissRecommendationButton : "not interested" control layered over a
 * recommendation card (top-left, where recommendation cards show no
 * platforms). Revealed on hover / focus on desktop, always visible on touch.
 */

import type { MouseEvent } from "react";
import { Icon } from "@iconify/react";

interface DismissRecommendationButtonProps {
  label: string;
  disabled?: boolean;
  onDismiss: () => void;
}

export function DismissRecommendationButton({
  label,
  disabled = false,
  onDismiss,
}: DismissRecommendationButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDismiss();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="bg-editorial-bg/80 border-editorial-line hover:border-editorial-accent hover:text-editorial-accent focus-visible:outline-editorial-accent pointer-events-none absolute top-2 left-2 z-[2] grid size-11 place-items-center rounded-full border text-white opacity-0 backdrop-blur-md transition group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100"
    >
      <Icon icon="lucide:eye-off" className="size-4" aria-hidden />
    </button>
  );
}
