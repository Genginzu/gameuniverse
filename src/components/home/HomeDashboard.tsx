"use client";

/**
 * HomeDashboard : personalised home for logged-in users.
 *
 * Order: hero (identity, level, stats, shortcuts) → continue playing →
 * personal recommendations → friends activity → trending / upcoming rails.
 * Editorial Tailwind inline, no glassmorphism. See docs/features/home.md.
 */

import type { User } from "@supabase/supabase-js";

import type { HomeApiResponse } from "@/types/home";
import { ContinuePlayingSection } from "./dashboard/ContinuePlayingSection";
import { DiscoverSections } from "./dashboard/DiscoverSections";
import { FriendsActivitySection } from "./dashboard/FriendsActivitySection";
import { HomeHero } from "./dashboard/HomeHero";
import { HOME_DASHBOARD_SHELL, HOME_DASHBOARD_STACK } from "./dashboard/layout";
import { RecommendationsSection } from "./dashboard/RecommendationsSection";

interface HomeDashboardProps {
  user: User;
  /** Initial `/api/home` data hydrated server-side (ISR). */
  initialData?: HomeApiResponse;
}

export function HomeDashboard({ user, initialData }: HomeDashboardProps) {
  return (
    <div className={HOME_DASHBOARD_SHELL} data-testid="home-dashboard">
      <div className={HOME_DASHBOARD_STACK}>
        <HomeHero user={user} />
        <ContinuePlayingSection />
        <RecommendationsSection />
        <FriendsActivitySection />
        <DiscoverSections initialData={initialData} />
      </div>
    </div>
  );
}
