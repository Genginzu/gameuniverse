"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Gamepad2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerLibraryGrid } from "./PlayerLibraryGrid";
import { StatsDashboardSkeleton } from "@/components/players/stats/StatsDashboardSkeleton";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
// ActivityFeed is the default tab — keep it static to avoid loading delay
import { ActivityFeed } from "./ActivityFeed";
import type { ProfileTab } from "./PlayerProfileTabs";
import type { PlayerDetails } from "@/types/player";
import type { UseFriendsReturn } from "@/hooks/useFriends";

// --- Generic skeleton for tabs without a dedicated one ---
function TabSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card animate-pulse rounded-xl p-5">
          <div className="mb-4 flex gap-4">
            <div className="h-20 w-14 rounded-lg bg-gray-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-6 w-16 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Skeleton for recommendations (game card grid) ---
function RecommendationsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="aspect-3/4 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// --- Skeleton for friends (card grid) ---
function FriendsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-200 dark:bg-slate-700/50" />
      ))}
    </div>
  );
}

// --- Dynamic imports: each tab is code-split into its own chunk ---
const LazyStatsDashboard = dynamic(
  () =>
    import("@/components/players/stats/StatsDashboard").then((m) => ({
      default: m.StatsDashboard,
    })),
  { loading: () => <StatsDashboardSkeleton /> }
);

const LazyPlayerReviewsFeed = dynamic(
  () => import("./PlayerReviewsFeed").then((m) => ({ default: m.PlayerReviewsFeed })),
  { loading: () => <TabSkeleton /> }
);

const LazyPlayerCollectionsFeed = dynamic(
  () =>
    import("./PlayerCollectionsFeed").then((m) => ({
      default: m.PlayerCollectionsFeed,
    })),
  { loading: () => <TabSkeleton /> }
);

const LazyAchievementsPageContent = dynamic(
  () =>
    import("@/components/achievements/AchievementsPageContent").then((m) => ({
      default: m.AchievementsPageContent,
    })),
  { loading: () => <TabSkeleton /> }
);

const LazyFriendsTab = dynamic(
  () => import("./FriendsTab").then((m) => ({ default: m.FriendsTab })),
  { loading: () => <FriendsSkeleton /> }
);

const LazyPersonalRecommendationSection = dynamic(
  () =>
    import("@/components/games/PersonalRecommendationSection").then((m) => ({
      default: m.PersonalRecommendationSection,
    })),
  { loading: () => <RecommendationsSkeleton /> }
);

const LazySettingsContent = dynamic(
  () =>
    import("@/components/settings/SettingsContent").then((m) => ({
      default: m.SettingsContent,
    })),
  { loading: () => <SettingsSkeleton /> }
);

// --- Types ---
interface PlayerTabContentProps {
  activeTab: ProfileTab;
  player: PlayerDetails;
  locale: string;
  isOwner: boolean;
  friendsHook: UseFriendsReturn;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

/**
 * Keep-alive tab content with lazy loading.
 * Tabs are code-split via next/dynamic and mounted on first visit.
 * Once mounted, they stay in the DOM (hidden via CSS) to preserve state.
 */
export function PlayerTabContent({
  activeTab,
  player,
  locale,
  isOwner,
  friendsHook,
  t,
  tCommon,
}: PlayerTabContentProps) {
  const [visitedTabs, setVisitedTabs] = useState<Set<ProfileTab>>(() => new Set([activeTab]));

  const markVisited = useCallback((tab: ProfileTab) => {
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  if (!visitedTabs.has(activeTab)) {
    markVisited(activeTab);
  }

  return (
    <>
      <TabPanel visible={activeTab === "activity"} mounted={visitedTabs.has("activity")}>
        <ActivityFeed
          playerId={player.id}
          playerName={player.fullName}
          playerAvatar={player.avatarUrl}
          locale={locale}
          isOwner={isOwner}
        />
      </TabPanel>

      <TabPanel visible={activeTab === "library"} mounted={visitedTabs.has("library")}>
        <LibraryTab player={player} locale={locale} t={t} tCommon={tCommon} />
      </TabPanel>

      <TabPanel visible={activeTab === "stats"} mounted={visitedTabs.has("stats")}>
        <LazyStatsDashboard
          playerId={player.id}
          locale={locale}
          isOwnProfile={isOwner}
          statsPrivate={player.statsPrivate}
        />
      </TabPanel>

      <TabPanel visible={activeTab === "collections"} mounted={visitedTabs.has("collections")}>
        <LazyPlayerCollectionsFeed playerId={player.id} locale={locale} isOwner={isOwner} />
      </TabPanel>

      <TabPanel visible={activeTab === "achievements"} mounted={visitedTabs.has("achievements")}>
        <LazyAchievementsPageContent playerId={player.id} />
      </TabPanel>

      <TabPanel visible={activeTab === "friends"} mounted={visitedTabs.has("friends")}>
        <LazyFriendsTab playerId={player.id} locale={locale} friendsHook={friendsHook} />
      </TabPanel>

      {isOwner && (
        <TabPanel
          visible={activeTab === "recommendations"}
          mounted={visitedTabs.has("recommendations")}
        >
          <LazyPersonalRecommendationSection locale={locale} />
        </TabPanel>
      )}

      <TabPanel visible={activeTab === "reviews"} mounted={visitedTabs.has("reviews")}>
        <LazyPlayerReviewsFeed playerId={player.id} locale={locale} />
      </TabPanel>

      {isOwner && (
        <TabPanel visible={activeTab === "settings"} mounted={visitedTabs.has("settings")}>
          <LazySettingsContent />
        </TabPanel>
      )}
    </>
  );
}

/** Renders children only after first visit, then hides via CSS instead of unmounting */
function TabPanel({
  visible,
  mounted,
  children,
}: {
  visible: boolean;
  mounted: boolean;
  children: React.ReactNode;
}) {
  if (!mounted) return null;

  return (
    <div role="tabpanel" aria-hidden={!visible} style={{ display: visible ? undefined : "none" }}>
      {children}
    </div>
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
