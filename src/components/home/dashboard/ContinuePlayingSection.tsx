"use client";

/**
 * ContinuePlayingSection : library games with the `playing` status (most
 * recently added first). Below 5 cards, the latest owned games fill the rail
 * as suggestions, after a separator, each with an "I'm playing it" button.
 */

import { useTranslations } from "next-intl";
import useSWR from "swr";

import { CONTINUE_PLAYING_TARGET, usePlayingSuggestions } from "@/hooks/usePlayingSuggestions";
import { buildLibraryUrl } from "@/lib/utils/libraryQueryParams";
import type { LibraryResponse } from "@/types/library";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeGameRail, type HomeRailItem } from "./HomeGameRail";
import { HomeSection } from "./HomeSection";
import { MarkPlayingButton } from "./MarkPlayingButton";

const MAX_ITEMS = 12;
const PLAYING_URL = buildLibraryUrl({ status: "playing", limit: MAX_ITEMS });

export function ContinuePlayingSection() {
  const t = useTranslations("homeDashboard.continuePlaying");
  // Server-side filter: loading the whole library just for this rail can time out.
  const { data, error } = useSWR<LibraryResponse>(PLAYING_URL, {
    onError: () => {},
    revalidateOnFocus: false,
  });

  const items: HomeRailItem[] = (data?.games ?? [])
    .filter((game) => game.libraryStatus === "playing")
    .map((game) => ({
      game,
      overlay: {
        type: "library",
        status: "playing",
        rating: game.userRating ?? null,
        playtimeHours: game.playTimeHours,
      },
    }));

  const settled = Boolean(data || error);
  const missing = settled ? Math.max(0, CONTINUE_PLAYING_TARGET - items.length) : 0;
  const suggestions = usePlayingSuggestions(missing);
  const suggestionItems: HomeRailItem[] = suggestions.games.map((game) => ({
    game,
    action: (
      <MarkPlayingButton
        label={t("markPlaying")}
        ariaLabel={t("markPlayingLabel", { title: game.title })}
        disabled={suggestions.isPending}
        onClick={() => suggestions.markPlaying(game.id)}
      />
    ),
  }));
  const onlySuggestions = items.length === 0 && suggestionItems.length > 0;

  return (
    <HomeSection
      id="home-continue-playing"
      kicker={t("kicker")}
      title={t("title")}
      seeAll={{ href: "/library", label: t("seeAll") }}
    >
      {onlySuggestions && (
        <p className="text-editorial-muted -mt-2 text-sm sm:text-base">{t("suggestionsTitle")}</p>
      )}
      <HomeGameRail
        label={t("title")}
        items={items}
        suggestions={{ label: t("suggestionsSeparator"), items: suggestionItems }}
        isLoading={!settled || (items.length === 0 && suggestions.loading)}
        priorityCount={3}
        empty={
          <HomeEmptyState
            icon="lucide:gamepad-2"
            message={t("empty")}
            action={{ href: "/library", label: t("emptyAction") }}
          />
        }
      />
    </HomeSection>
  );
}
