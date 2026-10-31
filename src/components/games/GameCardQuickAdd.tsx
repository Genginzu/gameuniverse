"use client";

/**
 * GameCardQuickAdd : quick library / wishlist toggles over a GameCard, stacked
 * one below the other.
 *   - Library icon adds the game to the library; once owned, the accent
 *     library icon removes it again.
 *   - Below it, a star adds the game to the wishlist (wanted, not bought yet);
 *     once wished, an accent star removes it. Both buttons are always shown,
 *     so the stack never changes shape: wishing an owned game moves it to the
 *     wishlist, adding a wished game to the library makes it owned.
 * The clicked button shows a spinner while its request runs.
 * Revealed on hover / focus on desktop, always visible on touch devices.
 * Renders nothing outside a LibraryStatusProvider or when signed out.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useQuickAddToLibrary } from "@/hooks/useQuickAddToLibrary";
import type { QuickAddCallbacks } from "@/types/library";
import { CardActionButton } from "./CardActionButton";
import { CardActiveToggleButton } from "./CardActiveToggleButton";

// Same icons as the "My library" navigation link and the wishlist status.
const LIBRARY_ICON = "lucide:library";
const WISHLIST_ICON = "lucide:star";

interface GameCardQuickAddProps {
  gameId: string;
  title: string;
  /** Pushed below the top-left badges (platforms, library status). */
  belowBadges: boolean;
  /** Context-specific buttons stacked above (e.g. "not interested"). */
  leading?: ReactNode;
  /** Caller reactions to an addition (e.g. drop a recommendation). */
  callbacks?: QuickAddCallbacks;
}

export function GameCardQuickAdd({
  gameId,
  title,
  belowBadges,
  leading,
  callbacks,
}: GameCardQuickAddProps) {
  const t = useTranslations("games.quickAdd");
  const { available, owned, wished, loading, pending, toggleLibrary, toggleWishlist } =
    useQuickAddToLibrary(gameId, callbacks);

  if (!available || loading) return null;

  const position = belowBadges ? "top-9" : "top-2";
  const libraryBusy = pending === "library";
  const wishlistBusy = pending === "wishlist";

  return (
    <div
      className={`pointer-events-none absolute left-2 z-[5] flex flex-col items-start gap-3 opacity-0 transition group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 ${position}`}
    >
      {leading}
      {owned ? (
        <CardActiveToggleButton
          icon={LIBRARY_ICON}
          label={t("remove", { title })}
          busy={libraryBusy}
          disabled={wishlistBusy}
          onClick={toggleLibrary}
        />
      ) : (
        <CardActionButton
          icon={LIBRARY_ICON}
          label={t("add", { title })}
          busy={libraryBusy}
          disabled={wishlistBusy}
          onClick={toggleLibrary}
        />
      )}

      {wished ? (
        <CardActiveToggleButton
          icon={WISHLIST_ICON}
          label={t("wishlistRemove", { title })}
          busy={wishlistBusy}
          disabled={libraryBusy}
          onClick={toggleWishlist}
        />
      ) : (
        <CardActionButton
          icon={WISHLIST_ICON}
          label={t("wishlistAdd", { title })}
          busy={wishlistBusy}
          disabled={libraryBusy}
          onClick={toggleWishlist}
        />
      )}
    </div>
  );
}
