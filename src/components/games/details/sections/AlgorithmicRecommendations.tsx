"use client";

/**
 * Fallback de SimilarGamesSection : recommandations algorithmiques (SQL
 * recommend_similar_games) quand IGDB ne fournit pas de similar_games
 * utilisables. Charge via `useRecommendations` et rend une grille GameCard.
 */

import { useTranslations } from "next-intl";

import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { useRecommendations } from "@/hooks/useRecommendations";
import { recommendationToGameSummary } from "@/lib/utils/recommendationToGameSummary";

interface AlgorithmicRecommendationsProps {
  gameSlug: string;
  locale: string;
}

const MAX_RECS = 10;

export function AlgorithmicRecommendations({ gameSlug }: AlgorithmicRecommendationsProps) {
  const t = useTranslations("recommendations");
  const { recommendations, loading, error } = useRecommendations(gameSlug);

  if (error && !loading) return null;

  if (loading) {
    return (
      <div className="editorial-game-detail-similar-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return <p className="text-zinc-400">{t("empty")}</p>;
  }

  return (
    <div className="editorial-game-detail-similar-grid">
      {recommendations.slice(0, MAX_RECS).map((rec) => (
        <GameCard key={rec.id} game={recommendationToGameSummary(rec)} />
      ))}
    </div>
  );
}
