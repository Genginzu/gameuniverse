"use client";

import { useTranslations } from "next-intl";
import { usePersonalRecommendations } from "@/hooks/usePersonalRecommendations";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { Sparkles } from "lucide-react";
import type { GameRecommendation } from "@/types/recommendation";

interface PersonalRecommendationSectionProps {
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
    metascore: rec.metascore ?? undefined,
  };
}

export function PersonalRecommendationSection({
  locale = "fr",
}: PersonalRecommendationSectionProps) {
  const t = useTranslations("recommendations");
  const { recommendations, basedOnGameCount, loading, error } = usePersonalRecommendations();

  // Erreur silencieuse — ne pas afficher la section
  if (error && !loading) return null;

  const hasRecommendations = recommendations.length > 0;

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white md:text-2xl">{t("personalTitle")}</h2>
        {basedOnGameCount > 0 && !loading && (
          <span className="rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-300">
            {t("basedOnGames", { count: basedOnGameCount })}
          </span>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && !hasRecommendations && (
        <p className="text-muted-foreground">{t("emptyLibrary")}</p>
      )}

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
