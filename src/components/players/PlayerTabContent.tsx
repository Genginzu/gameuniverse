"use client";

import { Gamepad2 } from "lucide-react";
import { PostsFeed } from "./PostsFeed";
import { PlayerLibraryGrid } from "./PlayerLibraryGrid";
import { PlayerCollectionsFeed } from "./PlayerCollectionsFeed";
import { PersonalRecommendationSection } from "@/components/games/PersonalRecommendationSection";
import { ActivityFeed } from "./ActivityFeed";
import { FriendsTab } from "./FriendsTab";
import { PlayerReviewsFeed } from "./PlayerReviewsFeed";
import { StatsDashboard } from "@/components/players/stats/StatsDashboard";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { AchievementsPageContent } from "@/components/achievements/AchievementsPageContent";
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
  availableYears: _availableYears,
  user: _user,
  t,
  tCommon,
}: PlayerTabContentProps) {
  switch (activeTab) {
    case "posts":
      return (
        <PostsFeed
          playerId={player.id}
          playerName={player.fullName}
          playerAvatar={player.avatarUrl}
          locale={locale}
          isOwner={isOwner}
        />
      );
    case "library":
      return <LibraryTab player={player} locale={locale} t={t} tCommon={tCommon} />;
    case "stats":
      return (
        <StatsDashboard
          playerId={player.id}
          locale={locale}
          isOwnProfile={isOwner}
          statsPrivate={player.statsPrivate}
        />
      );
    case "collections":
      return <PlayerCollectionsFeed playerId={player.id} locale={locale} isOwner={isOwner} />;
    case "achievements":
      return <AchievementsPageContent playerId={player.id} />;
    case "activity":
      return <ActivityFeed playerId={player.id} locale={locale} />;
    case "friends":
      return <FriendsTab playerId={player.id} locale={locale} />;
    case "recommendations":
      return isOwner ? <PersonalRecommendationSection locale={locale} /> : null;
    case "reviews":
      return <PlayerReviewsFeed playerId={player.id} locale={locale} />;
    case "settings":
      return isOwner ? <SettingsContent /> : null;
    default:
      return (
        <PostsFeed
          playerId={player.id}
          playerName={player.fullName}
          playerAvatar={player.avatarUrl}
          locale={locale}
          isOwner={isOwner}
        />
      );
  }
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
