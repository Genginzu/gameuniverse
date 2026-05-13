"use client";

/**
 * HomeContent : orchestration de la page d'accueil refondue.
 *
 * Deux variantes :
 *   - Visiteur déconnecté : landing éditorial complet (hero plein cadre,
 *     marquee, features, trending, stats, CTA).
 *   - Utilisateur connecté : `HomeDashboard` éditorial (trending + upcoming).
 *
 * Les deux variantes reçoivent les mêmes données initiales (`trending` +
 * `upcoming`) hydratées server-side via ISR (cf `page.tsx`).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useAuth } from "@/hooks/useAuth";
import { CtaSection } from "./CtaSection";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";
import { HomeDashboard } from "./HomeDashboard";
import { MarqueeSection } from "./MarqueeSection";
import { StatsSection } from "./StatsSection";
import { TrendingSection } from "./TrendingSection";
import type { GameSummary } from "@/types/game";

interface HomeApiResponse {
  trending: GameSummary[];
  upcoming: GameSummary[];
}

interface HomeContentProps {
  /** Données hydratées server-side via /api/home (ISR 5 min). */
  initialHomeData?: HomeApiResponse;
}

export function HomeContent({ initialHomeData }: HomeContentProps) {
  const { user, loading } = useAuth();
  const isAuthenticated = !loading && !!user;

  if (loading) return null;

  if (isAuthenticated) {
    return <HomeDashboard initialData={initialHomeData} />;
  }

  // Le jeu trending #1 alimente l'image de fond + l'image inline du hero.
  const featuredGame = initialHomeData?.trending?.[0];

  return (
    <div className="editorial-home">
      <HeroSection featuredGame={featuredGame} />
      <MarqueeSection />
      <FeaturesSection />
      <TrendingSection initialData={initialHomeData} />
      <StatsSection />
      <CtaSection />
    </div>
  );
}
