"use client";

/**
 * GameCardQuickAdd : "+" button over a GameCard that adds the game to the
 * player's library in one click; shows a check once the game is in it.
 * Revealed on hover / focus on desktop, always visible on touch devices.
 * Renders nothing outside a LibraryStatusProvider or when signed out.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useQuickAddToLibrary } from "@/hooks/useQuickAddToLibrary";
import { CardActionButton } from "./CardActionButton";

interface GameCardQuickAddProps {
  gameId: string;
  title: string;
  /** Pushed below the top-left badges (platforms, library status). */
  belowBadges: boolean;
}

export function GameCardQuickAdd({ gameId, title, belowBadges }: GameCardQuickAddProps) {
  const t = useTranslations("games.quickAdd");
  const { available, inLibrary, loading, isPending, add } = useQuickAddToLibrary(gameId);

  if (!available || loading) return null;

  const position = belowBadges ? "top-9" : "top-2";

  return (
    <div
      className={`pointer-events-none absolute left-2 z-[5] opacity-0 transition group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 ${position}`}
    >
      {inLibrary ? (
        <span
          role="img"
          aria-label={t("inLibrary", { title })}
          title={t("inLibrary", { title })}
          className="bg-editorial-accent grid size-11 place-items-center rounded-full text-white"
        >
          <Icon icon="lucide:check" className="size-4" aria-hidden />
        </span>
      ) : (
        <CardActionButton
          icon="lucide:plus"
          label={t("add", { title })}
          disabled={isPending}
          onClick={add}
        />
      )}
    </div>
  );
}
