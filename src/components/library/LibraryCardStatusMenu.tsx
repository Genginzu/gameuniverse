"use client";

/**
 * LibraryCardStatusMenu : status control over a GameCard of the player's own
 * library (`/library`). A round button showing the current status opens the
 * status menu; always visible, its icons are explained by LibraryStatusLegend.
 * Setting a game to "completed" opens the playtime dialog; a completed game
 * keeps a timer button below its status to open it again.
 * Statuses are batch-seeded by the surrounding LibraryStatusProvider.
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { CardActionButton } from "@/components/games/CardActionButton";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { useLibraryEntry } from "@/hooks/useLibraryEntry";
import { toast } from "@/hooks/use-toast";
import type { LibraryStatus } from "@/types/library";
import { CompletedPlaytimeDialog } from "./CompletedPlaytimeDialog";
import { LIBRARY_STATUS_ICONS, LibraryStatusMenu } from "./LibraryStatusMenu";

interface LibraryCardStatusMenuProps {
  gameId: string;
  slug: string;
  title: string;
  /** Pushed below the top-left badges (platforms). */
  belowBadges: boolean;
}

const TRIGGER =
  "bg-editorial-bg/80 border-editorial-line hover:border-editorial-accent hover:text-editorial-accent aria-expanded:border-editorial-accent aria-expanded:text-editorial-accent aria-busy:border-editorial-accent aria-busy:text-editorial-accent focus-visible:outline-editorial-accent grid size-11 place-items-center rounded-full border text-white backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait";

export function LibraryCardStatusMenu({
  gameId,
  slug,
  title,
  belowBadges,
}: LibraryCardStatusMenuProps) {
  const t = useTranslations("libraryStatus");
  const { signedIn } = useLibraryStatus();
  const [askPlaytime, setAskPlaytime] = useState(false);
  const { inLibrary, status, loading, adding, setStatus, removeFromLibrary } = useLibraryEntry(
    gameId,
    signedIn
  );

  if (!signedIn || loading || !inLibrary) return null;

  const current = status ?? "owned";
  const reportFailure = async (action: () => Promise<boolean>) => {
    if (!(await action())) toast({ title: t("error"), variant: "destructive" });
  };
  const select = (next: LibraryStatus) => {
    // Completing a game is the moment to log how long it took.
    if (next === "completed" && current !== "completed") setAskPlaytime(true);
    return reportFailure(() => setStatus(next));
  };

  return (
    <div className={`absolute left-2 z-[5] flex flex-col gap-2 ${belowBadges ? "top-9" : "top-2"}`}>
      <LibraryStatusMenu
        status={current}
        onSelect={select}
        onRemove={() => reportFailure(removeFromLibrary)}
        renderTrigger={({ open: _open, ...triggerProps }) => (
          <button
            type="button"
            {...triggerProps}
            disabled={adding}
            aria-busy={adding}
            aria-label={t("cardTriggerLabel", { title, status: t(current) })}
            title={t(current)}
            className={TRIGGER}
          >
            <Icon
              icon={adding ? "svg-spinners:ring-resize" : LIBRARY_STATUS_ICONS[current]}
              className="size-4"
              aria-hidden
            />
          </button>
        )}
      />
      {current === "completed" && (
        <CardActionButton
          icon="lucide:timer"
          label={t("playtimeButtonLabel", { title })}
          onClick={() => setAskPlaytime(true)}
        />
      )}
      {askPlaytime && (
        <CompletedPlaytimeDialog slug={slug} title={title} onClose={() => setAskPlaytime(false)} />
      )}
    </div>
  );
}
