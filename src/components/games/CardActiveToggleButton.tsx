"use client";

/**
 * CardActiveToggleButton : round 44px accent button over a GameCard for an
 * action already done (game in the library, wished…). Clicking undoes it: the
 * icon turns into a red cross on hover / focus to announce the removal, and
 * into a spinner while the request runs.
 * Rendered as a sibling of the card link, so the click must not bubble to it.
 */

import type { MouseEvent } from "react";
import { Icon } from "@iconify/react";

import { CARD_ACTION_SPINNER } from "./CardActionButton";

interface CardActiveToggleButtonProps {
  icon: string;
  label: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function CardActiveToggleButton({
  icon,
  label,
  busy,
  disabled = false,
  onClick,
}: CardActiveToggleButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      aria-label={label}
      title={label}
      className={`bg-editorial-accent group/active focus-visible:outline-editorial-accent grid size-11 place-items-center rounded-full text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
        busy ? "cursor-wait" : "hover:bg-red-500 focus-visible:bg-red-500 disabled:cursor-not-allowed"
      }`}
    >
      {busy ? (
        <Icon icon={CARD_ACTION_SPINNER} className="size-4" aria-hidden />
      ) : (
        <>
          <Icon
            icon={icon}
            className="size-4 group-hover/active:hidden group-focus-visible/active:hidden"
            aria-hidden
          />
          <Icon
            icon="lucide:x"
            className="hidden size-4 group-hover/active:block group-focus-visible/active:block"
            aria-hidden
          />
        </>
      )}
    </button>
  );
}
