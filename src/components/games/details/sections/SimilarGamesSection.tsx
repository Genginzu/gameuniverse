"use client";

/**
 * Section "Similar games" : utilise les similar_games IGDB si dispo,
 * sinon les recommandations algorithmiques (RecommendationSection).
 *
 * Affichage : grille 4 cols d'EditorialGameCard.
 */

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { EditorialGameCard } from "@/components/games/EditorialGameCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails, GameSummary } from "@/types/game";
import { accentRich } from "../utils/accent-rich";

// Lazy load le hook de recommandations algo si besoin (cas sans similar_games).
const AlgorithmicRecommendations = dynamic(
  () => import("./AlgorithmicRecommendations").then((m) => m.AlgorithmicRecommendations),
  { ssr: false }
);

interface SimilarGamesSectionProps {
  game: GameDetails;
  locale: string;
}

const MAX_SIMILAR = 8;

function toGameSummary(s: NonNullable<GameDetails["similarGames"]>[number]): GameSummary | null {
  if (!s.game) return null;
  return {
    id: s.game.id,
    slug: s.game.slug,
    title: s.game.title,
    coverImage: s.game.coverImage ?? undefined,
    genres: s.game.genres,
    developer: s.game.developer,
    publisher: "",
    metascore: s.game.metascore ?? undefined,
  };
}

export function SimilarGamesSection({ game, locale }: SimilarGamesSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");

  const resolved = (game.similarGames ?? [])
    .map(toGameSummary)
    .filter((g): g is GameSummary => g !== null)
    .slice(0, MAX_SIMILAR);

  const hasResolved = resolved.length > 0;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-header">
        <div>
          <KickerLabel className="mb-3">13 — {tEd("sections.youMightAlsoLike")}</KickerLabel>
          <h2>{tEd.rich("sections.similarTitle", accentRich)}</h2>
        </div>
      </div>

      {hasResolved ? (
        <div className="editorial-game-detail-similar-grid">
          {resolved.map((g) => (
            <EditorialGameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <AlgorithmicRecommendations gameSlug={game.slug} locale={locale} />
      )}
    </section>
  );
}
