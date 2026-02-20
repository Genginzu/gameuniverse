"use client";

import { useTranslations } from "next-intl";
import { useRecommendations } from "@/hooks/useRecommendations";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import type { GameRecommendation } from "@/types/recommendation";

interface RecommendationSectionProps {
  gameSlug: string;
  locale?: string;
}

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
  };
}

export function RecommendationSection({ gameSlug, locale = "fr" }: RecommendationSectionProps) {
  const t = useTranslations("recommendations");
  const { recommendations, loading, error } = useRecommendations(gameSlug);

  // Ne rien afficher en cas d'erreur silencieuse
  if (error && !loading) return null;

  const hasRecommendations = recommendations.length > 0;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">{t("title")}</h2>

      {loading && (
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && !hasRecommendations && <p className="text-muted-foreground">{t("empty")}</p>}

      {!loading && hasRecommendations && (
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {recommendations.map((rec) => (
            <GameCard key={rec.id} game={toGameCardProps(rec)} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
