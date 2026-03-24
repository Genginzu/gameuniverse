"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { RecentGamesSection } from "./RecentGamesSection";
import { StatsSection } from "./StatsSection";
import { CtaSection } from "./CtaSection";

/**
 * Home page content — redirects authenticated users to profile,
 * shows an immersive landing page for visitors.
 */
export function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAuthenticated = !loading && !!user;

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/profile");
    }
  }, [isAuthenticated, router]);

  // Authenticated users will be redirected
  if (isAuthenticated) return null;

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
