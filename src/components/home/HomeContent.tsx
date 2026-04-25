"use client";

import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { RecentGamesSection } from "./RecentGamesSection";
import { StatsSection } from "./StatsSection";
import { CtaSection } from "./CtaSection";
import { HomeDashboard } from "./HomeDashboard";

/**
 * Home page content — shows dashboard for authenticated users,
 * immersive landing page for visitors.
 */
export function HomeContent() {
  const { user, loading } = useAuth();
  const isAuthenticated = !loading && !!user;

  if (loading) return null;

  if (isAuthenticated) {
    return <HomeDashboard />;
  }

  return (
    <div className="flex-1">
      <HeroSection />
      <FeaturesSection />
      <RecentGamesSection />
      <StatsSection />
      <CtaSection />
    </div>
  );
}
