"use client";

/**
 * ContinuePlayingSection : library games with the `playing` status
 * (most recently added first).
 */

import { useTranslations } from "next-intl";
import useSWR from "swr";

import { buildLibraryUrl } from "@/lib/utils/libraryQueryParams";
import type { LibraryResponse } from "@/types/library";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeGameRail, type HomeRailItem } from "./HomeGameRail";
import { HomeSection } from "./HomeSection";

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

  return (
    <HomeSection
      id="home-continue-playing"
      kicker={t("kicker")}
      title={t("title")}
      seeAll={{ href: "/library", label: t("seeAll") }}
    >
      <HomeGameRail
        label={t("title")}
        items={items}
        isLoading={!data && !error}
        priorityCount={3}
        empty={
          <HomeEmptyState
            icon="lucide:gamepad-2"
            message={t("empty")}
            action={{ href: "/games", label: t("emptyAction") }}
          />
        }
      />
    </HomeSection>
  );
}
