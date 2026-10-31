"use client";

/**
 * HeroLibraryControl : library CTA of the game-detail hero.
 * Not in the library → "Add to my library" and "Add to my wishlist" (wanted,
 * not bought yet). In the library → the current status, opening a menu to
 * change it (playing, completed…) or remove the game.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { LIBRARY_STATUS_ICONS, LibraryStatusMenu } from "@/components/library/LibraryStatusMenu";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { toast } from "@/hooks/use-toast";

const CTA = "editorial-game-detail-cta-ghost min-w-[16rem] justify-center whitespace-nowrap";

export function HeroLibraryControl({ gameId }: { gameId: string }) {
  const tEd = useTranslations("gameDetails.editorial");
  const tStatus = useTranslations("libraryStatus");
  const {
    inLibrary,
    status,
    loading,
    adding,
    addToLibrary,
    addToWishlist,
    removeFromLibrary,
    setStatus,
  } = useGameLibraryStatus(gameId);
  const busy = loading || adding;

  const reportFailure = async (action: () => Promise<boolean>) => {
    if (!(await action())) toast({ title: tStatus("error"), variant: "destructive" });
  };

  if (!inLibrary) {
    return (
      <>
        <button
          type="button"
          onClick={() => reportFailure(addToLibrary)}
          disabled={busy}
          className={CTA}
        >
          <Icon icon={busy ? "svg-spinners:ring-resize" : "mdi:heart"} className="h-4 w-4" />
          {tEd("libraryAdd")}
        </button>
        <button
          type="button"
          onClick={() => reportFailure(addToWishlist)}
          disabled={busy}
          className="editorial-game-detail-cta-ghost justify-center whitespace-nowrap"
        >
          <Icon icon={LIBRARY_STATUS_ICONS.wishlist} className="h-4 w-4" aria-hidden />
          {tEd("wishlistAdd")}
        </button>
      </>
    );
  }

  const current = status ?? "owned";

  return (
    <LibraryStatusMenu
      status={current}
      onSelect={(next) => reportFailure(() => setStatus(next))}
      onRemove={() => reportFailure(removeFromLibrary)}
      renderTrigger={({ open: _open, ...triggerProps }) => (
        <button
          type="button"
          {...triggerProps}
          disabled={busy}
          aria-label={tStatus("triggerLabel", { status: tStatus(current) })}
          className={`${CTA} is-active group`}
        >
          <Icon
            icon={busy ? "svg-spinners:ring-resize" : LIBRARY_STATUS_ICONS[current]}
            className="h-4 w-4"
          />
          {tStatus(current)}
          <Icon
            icon="lucide:chevron-down"
            className="h-4 w-4 transition-transform group-aria-expanded:rotate-180"
            aria-hidden
          />
        </button>
      )}
    />
  );
}
