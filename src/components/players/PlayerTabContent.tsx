"use client";

import { useState, useCallback } from "react";
import {
  LazyStatsDashboard,
  LazyPlayerReviewsFeed,
  LazyPlayerCollectionsFeed,
  LazyAchievementsPageContent,
  LazyFriendsTab,
  LazyPersonalRecommendationSection,
  LazySettingsContent,
  LazySubscribedFeedTab,
  LazyGoalsTab,
} from "./PlayerLazyTabs";
import { PlayerLibraryTab } from "./PlayerLibraryTab";
import { ActivityFeed } from "./activity/ActivityFeed";
import type { ProfileTab } from "./profile-tabs";
import type { PlayerDetails } from "@/types/player";

interface PlayerTabContentProps {
  activeTab: ProfileTab;
  player: PlayerDetails;
  locale: string;
  isOwner: boolean;
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
      {isOwner && (
        <TabPanel visible={activeTab === "feed"} mounted={visitedTabs.has("feed")}>
          <LazySubscribedFeedTab viewerId={player.id} locale={locale} />
        </TabPanel>
      )}

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
        <PlayerLibraryTab player={player} locale={locale} t={t} tCommon={tCommon} />
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

      {isOwner && (
        <TabPanel visible={activeTab === "goals"} mounted={visitedTabs.has("goals")}>
          <LazyGoalsTab playerId={player.id} locale={locale} />
        </TabPanel>
      )}

      <TabPanel visible={activeTab === "friends"} mounted={visitedTabs.has("friends")}>
        <LazyFriendsTab playerId={player.id} locale={locale} />
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
