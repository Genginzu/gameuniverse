"use client";

/**
 * HomeLanding : landing marketing des visiteurs déconnectés.
 *
 * Ordre : hero → marquee → 6 aperçus produit → trending → stats réelles → CTA.
 * La section stats est masquée quand les compteurs sont indisponibles.
 */

import type { HomeApiResponse } from "@/types/home";
import { CtaSection } from "./CtaSection";
import { HeroSection } from "./HeroSection";
import { MarqueeSection } from "./MarqueeSection";
import { StatsSection } from "./StatsSection";
import { TrendingSection } from "./TrendingSection";
import { ProductPreviewsSection } from "./previews/ProductPreviewsSection";

interface HomeLandingProps {
  data?: HomeApiResponse;
}

export function HomeLanding({ data }: HomeLandingProps) {
  const stats = data?.stats ?? null;

  return (
    <div className="bg-editorial-bg min-h-screen overflow-x-hidden text-white">
      <HeroSection featuredGame={data?.trending?.[0] ?? data?.upcoming?.[0]} />
      <MarqueeSection />
      <ProductPreviewsSection data={data} />
      <TrendingSection initialData={data} />
      {stats && <StatsSection stats={stats} />}
      <CtaSection />
    </div>
  );
}
