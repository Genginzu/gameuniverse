import type { GameSummary } from "@/types/game";
import type { GameRecommendation } from "@/types/recommendation";

/** Maps a recommendation to the `GameSummary` shape expected by `GameCard`. */
export function recommendationToGameSummary(rec: GameRecommendation): GameSummary {
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
