"use client";

import dynamic from "next/dynamic";
import { StatsDashboardSkeleton } from "@/components/players/stats/StatsDashboardSkeleton";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { ReviewsFeedSkeleton } from "./reviews/ReviewsFeedSkeleton";
import { CollectionsFeedSkeleton } from "./collections/CollectionsFeedSkeleton";
import { TabSkeleton, RecommendationsSkeleton, FriendsSkeleton } from "./PlayerTabSkeletons";

export const LazyStatsDashboard = dynamic(
  () =>
    import("@/components/players/stats/StatsDashboard").then((m) => ({
      default: m.StatsDashboard,
    })),
  { loading: () => <StatsDashboardSkeleton /> }
);

export const LazyPlayerReviewsFeed = dynamic(
  () => import("./reviews/PlayerReviewsFeed").then((m) => ({ default: m.PlayerReviewsFeed })),
  { loading: () => <ReviewsFeedSkeleton /> }
);

export const LazyPlayerCollectionsFeed = dynamic(
  () =>
    import("./collections/PlayerCollectionsFeed").then((m) => ({
      default: m.PlayerCollectionsFeed,
    })),
  { loading: () => <CollectionsFeedSkeleton /> }
);

export const LazyAchievementsPageContent = dynamic(
  () =>
    import("@/components/achievements/AchievementsPageContent").then((m) => ({
      default: m.AchievementsPageContent,
    })),
  { loading: () => <TabSkeleton /> }
);

export const LazyFriendsTab = dynamic(
  () => import("./friends/FriendsTab").then((m) => ({ default: m.FriendsTab })),
  { loading: () => <FriendsSkeleton /> }
);

export const LazyPersonalRecommendationSection = dynamic(
  () =>
    import("@/components/games/details/PersonalRecommendationSection").then((m) => ({
      default: m.PersonalRecommendationSection,
    })),
  { loading: () => <RecommendationsSkeleton /> }
);

export const LazySettingsContent = dynamic(
  () =>
    import("@/components/settings/SettingsContent").then((m) => ({
      default: m.SettingsContent,
    })),
  { loading: () => <SettingsSkeleton /> }
);

export const LazySubscribedFeedTab = dynamic(
  () => import("./feed/SubscribedFeedTab").then((m) => ({ default: m.SubscribedFeedTab })),
  { loading: () => <TabSkeleton /> }
);

export const LazyGoalsTab = dynamic(
  () => import("./goals/GoalsTab").then((m) => ({ default: m.GoalsTab })),
  { loading: () => <TabSkeleton /> }
);
