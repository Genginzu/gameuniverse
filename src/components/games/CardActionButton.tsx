"use client";

/**
 * CardActionButton : round 44px icon button layered over a GameCard.
 * Rendered as a sibling of the card link, so the click must not bubble to it.
 */

import type { MouseEvent } from "react";
import { Icon } from "@iconify/react";

interface CardActionButtonProps {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function CardActionButton({ icon, label, disabled = false, onClick }: CardActionButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="bg-editorial-bg/80 border-editorial-line hover:border-editorial-accent hover:text-editorial-accent focus-visible:outline-editorial-accent grid size-11 place-items-center rounded-full border text-white backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon icon={icon} className="size-4" aria-hidden />
    </button>
  );
}
