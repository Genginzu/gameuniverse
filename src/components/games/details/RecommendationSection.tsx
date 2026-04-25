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

const MAX_RECOMMENDATIONS = 5;

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

export function RecommendationSection({ gameSlug, locale = "fr" }: RecommendationSectionProps) {
  const t = useTranslations("recommendations");
  const { recommendations, loading, error } = useRecommendations(gameSlug);

  // Ne rien afficher en cas d'erreur silencieuse
  if (error && !loading) return null;

  const hasRecommendations = recommendations.length > 0;

  return (
    <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-bold text-white">{t("title")}</h2>

      {loading && (
        <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: MAX_RECOMMENDATIONS }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && !hasRecommendations && <p className="text-slate-400">{t("empty")}</p>}

      {!loading && hasRecommendations && (
        <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recommendations.slice(0, MAX_RECOMMENDATIONS).map((rec) => (
            <GameCard key={rec.id} game={toGameCardProps(rec)} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
