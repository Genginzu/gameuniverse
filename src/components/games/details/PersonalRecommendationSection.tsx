"use client";

import { useTranslations } from "next-intl";
import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { Icon } from "@iconify/react";
import type { GameRecommendation } from "@/types/recommendation";

const SKELETON_COUNT = 4;

/** Mappe un GameRecommendation vers les props attendues par GameCard */
function toGameCardProps(rec: GameRecommendation) {
  return {
    id: rec.id,
    slug: rec.slug,
    title: rec.title,
    coverImage: rec.coverImage ?? undefined,
    genres: rec.genres,
    developer: rec.developer,
    publisher: "",
    metascore: rec.metascore ?? undefined,
  };
}

export function PersonalRecommendationSection() {
  const t = useTranslations("recommendations");
  const { recommendations, basedOnGameCount, loading, error } = usePersonalRecommendations();

  // Erreur silencieuse — ne pas afficher la section
  if (error && !loading) return null;

  const hasRecommendations = recommendations.length > 0;

  return (
    <section className="editorial-recommendations mb-8">
      <div className="editorial-recommendations-header">
        <Icon
          icon="lucide:sparkles"
          className="editorial-recommendations-icon"
          aria-hidden="true"
        />
        <h2 className="editorial-recommendations-title">{t("personalTitle")}</h2>
        {basedOnGameCount > 0 && !loading && (
          <span className="editorial-recommendations-count">
            {t("basedOnGames", { count: basedOnGameCount })}
          </span>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && !hasRecommendations && (
        <p className="text-muted-foreground">{t("emptyLibrary")}</p>
      )}

      {!loading && hasRecommendations && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recommendations.map((rec) => (
            <GameCard key={rec.id} game={toGameCardProps(rec)} />
          ))}
        </div>
      )}
    </section>
  );
}
