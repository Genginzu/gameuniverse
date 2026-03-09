"use client";

import { Gamepad2 } from "lucide-react";
import { PlayerLibraryGrid } from "./PlayerLibraryGrid";
import { PlayerFavoriteCharacters } from "./PlayerFavoriteCharacters";
import { PlayerCollections } from "./PlayerCollections";
import { LibraryComparisonSection } from "./LibraryComparisonSection";
import { PersonalRecommendationSection } from "@/components/games/PersonalRecommendationSection";
import { ActivityFeed } from "./ActivityFeed";
import { FriendsTab } from "./FriendsTab";
import { PlayerEnrichedStats } from "./PlayerEnrichedStats";
import { YearInReviewLink } from "./YearInReviewLink";
import { shouldShowComparison } from "./PlayerDetailsContent";
import type { ProfileTab } from "./PlayerProfileTabs";
import type { PlayerDetails } from "@/types/player";
import type { User } from "@supabase/supabase-js";

interface PlayerTabContentProps {
  activeTab: ProfileTab;
  player: PlayerDetails;
  locale: string;
  isOwner: boolean;
  availableYears: number[];
  user: User | null;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function PlayerTabContent({
  activeTab,
  player,
  locale,
  isOwner,
  availableYears,
  user,
  t,
  tCommon,
}: PlayerTabContentProps) {
  switch (activeTab) {
    case "overview":
      return (
        <OverviewTab
          player={player}
          locale={locale}
          isOwner={isOwner}
          availableYears={availableYears}
          user={user}
          t={t}
          tCommon={tCommon}
        />
      );
    case "library":
      return <LibraryTab player={player} locale={locale} t={t} tCommon={tCommon} />;
    case "stats":
      return (
        <PlayerEnrichedStats
          playerId={player.id}
          locale={locale}
          isOwnProfile={isOwner}
          statsPrivate={player.statsPrivate}
          totalGames={player.library.length}
        />
      );
    case "collections":
      return <PlayerCollections playerId={player.id} locale={locale} isOwner={isOwner} />;
    case "activity":
      return <ActivityFeed playerId={player.id} locale={locale} />;
    case "friends":
      return <FriendsTab playerId={player.id} locale={locale} />;
    case "recommendations":
      return isOwner ? <PersonalRecommendationSection locale={locale} /> : null;
    default:
      return (
        <OverviewTab
          player={player}
          locale={locale}
          isOwner={isOwner}
          availableYears={availableYears}
          user={user}
          t={t}
          tCommon={tCommon}
        />
      );
  }
}

/** Overview tab — shows stats, year-in-review, comparison, library preview, characters, collections */
function OverviewTab({
  player,
  locale,
  isOwner,
  availableYears,
  user,
  t,
  tCommon,
}: Omit<PlayerTabContentProps, "activeTab">) {
  return (
    <>
      <PlayerEnrichedStats
        playerId={player.id}
        locale={locale}
        isOwnProfile={isOwner}
        statsPrivate={player.statsPrivate}
        totalGames={player.library.length}
      />

      {availableYears.length > 0 && (
        <div className="mb-8">
          <YearInReviewLink playerId={player.id} availableYears={availableYears} />
        </div>
      )}

      {shouldShowComparison(!!user, user?.id ?? null, player.id) && (
        <LibraryComparisonSection playerId={player.id} locale={locale} />
      )}

      <LibraryTab player={player} locale={locale} t={t} tCommon={tCommon} />

      <PlayerFavoriteCharacters playerId={player.id} locale={locale} />
      <PlayerCollections playerId={player.id} locale={locale} isOwner={isOwner} />

      {isOwner && <PersonalRecommendationSection locale={locale} />}
    </>
  );
}

function LibraryTab({
  player,
  locale,
  t,
  tCommon,
}: {
  player: PlayerDetails;
  locale: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Gamepad2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          {t("details.library")}
        </h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-slate-700/50 dark:text-slate-300">
          {player.library.length} {tCommon("games")} {t("details.inLibrary")}
        </span>
      </div>
      <PlayerLibraryGrid games={player.library} locale={locale} />
    </div>
  );
}
