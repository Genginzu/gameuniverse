"use client";

/**
 * LibraryCardStatusMenu : status control over a GameCard of the player's own
 * library (`/library`). A round button showing the current status opens the
 * status menu. Revealed on hover / focus on desktop, always visible on touch.
 * Statuses are batch-seeded by the surrounding LibraryStatusProvider.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { useLibraryEntry } from "@/hooks/useLibraryEntry";
import { toast } from "@/hooks/use-toast";
import { LIBRARY_STATUS_ICONS, LibraryStatusMenu } from "./LibraryStatusMenu";

interface LibraryCardStatusMenuProps {
  gameId: string;
  title: string;
  /** Pushed below the top-left badges (platforms). */
  belowBadges: boolean;
}

export function LibraryCardStatusMenu({ gameId, title, belowBadges }: LibraryCardStatusMenuProps) {
  const t = useTranslations("libraryStatus");
  const { signedIn } = useLibraryStatus();
  const { inLibrary, status, loading, adding, setStatus, removeFromLibrary } = useLibraryEntry(
    gameId,
    signedIn
  );

  if (!signedIn || loading || !inLibrary) return null;

  const current = status ?? "owned";
  const reportFailure = async (action: () => Promise<boolean>) => {
    if (!(await action())) toast({ title: t("error"), variant: "destructive" });
  };

  return (
    <LibraryStatusMenu
      status={current}
      onSelect={(next) => reportFailure(() => setStatus(next))}
      onRemove={() => reportFailure(removeFromLibrary)}
      className={`pointer-events-none absolute left-2 z-[5] opacity-0 transition group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 has-[[aria-expanded=true]]:pointer-events-auto has-[[aria-expanded=true]]:opacity-100 has-[[aria-busy=true]]:opacity-100 ${
        belowBadges ? "top-9" : "top-2"
      }`}
      renderTrigger={({ open: _open, ...triggerProps }) => (
        <button
          type="button"
          {...triggerProps}
          disabled={adding}
          aria-busy={adding}
          aria-label={t("cardTriggerLabel", { title, status: t(current) })}
          title={t(current)}
          className="bg-editorial-bg/80 border-editorial-line hover:border-editorial-accent hover:text-editorial-accent aria-expanded:border-editorial-accent aria-expanded:text-editorial-accent aria-busy:border-editorial-accent aria-busy:text-editorial-accent focus-visible:outline-editorial-accent grid size-11 place-items-center rounded-full border text-white backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait"
        >
          <Icon
            icon={adding ? "svg-spinners:ring-resize" : LIBRARY_STATUS_ICONS[current]}
            className="size-4"
            aria-hidden
          />
        </button>
      )}
    />
  );
}
