import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type {
  PlayerReviewItem,
  PlayerReviewsStatsData,
  RatingDistribution,
  ReviewSortOption,
} from "@/types/playerReview";

const PAGE_SIZE = 10;

/** Rating distribution ranges */
const RATING_RANGES: { range: string; min: number; max: number }[] = [
  { range: "0-5", min: 0, max: 5 },
  { range: "6-10", min: 6, max: 10 },
  { range: "11-15", min: 11, max: 15 },
  { range: "16-20", min: 16, max: 20 },
];

/** Raw row shape returned by the Supabase select with joins */
interface ReviewRow {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  content: string;
  positive_points: string[];
  negative_points: string[];
  created_at: string;
  updated_at: string;
  games: {
    slug: string;
    cover_image_url: string | null;
    game_translations: Array<{ title: string }>;
  } | null;
}

/**
 * Server-side service for player reviews.
 * Queries game_reviews with joins on games and game_translations.
 * Used by the API route /api/players/[id]/reviews.
 */
export class PlayerReviewsServerService {
  /**
   * Fetch paginated reviews for a player, with game info in the given locale.
   */
  static async fetchPlayerReviews(
    playerId: string,
    locale: string,
    sort: ReviewSortOption = "date_desc",
    page: number = 1
  ): Promise<{ reviews: PlayerReviewItem[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * PAGE_SIZE;

    // Count total reviews for this player
    const { count, error: countError } = await supabase
      .from("game_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", playerId);

    if (countError) {
      if (countError.code === "PGRST205") {
        return { reviews: [], totalCount: 0 };
      }
      logger.error("Failed to count player reviews", { error: countError.message, playerId });
      throw new Error(countError.message ?? "Failed to count player reviews");
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { reviews: [], totalCount: 0 };
    }

    // Build the paginated query with joins
    let query = supabase
      .from("game_reviews")
      .select(
        `id, user_id, game_id, rating, content, positive_points, negative_points,
         created_at, updated_at,
         games(slug, cover_image_url, game_translations(title))`
      )
      .eq("user_id", playerId)
      .eq("games.game_translations.language_code", locale);

    // Apply sort order
    query = applySortOrder(query, sort);

    // Apply pagination
    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205") {
        return { reviews: [], totalCount: 0 };
      }
      logger.error("Failed to fetch player reviews", { error: error.message, playerId });
      throw new Error(error.message ?? "Failed to fetch player reviews");
    }

    const rows = (data ?? []) as unknown as ReviewRow[];
    const reviews = rows.map(transformRow);

    return { reviews, totalCount };
  }

  /**
   * Compute aggregated stats for a player's reviews:
   * total count, average rating, and distribution by range.
   */
  static async fetchPlayerReviewsStats(playerId: string): Promise<PlayerReviewsStatsData> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("game_reviews")
      .select("rating")
      .eq("user_id", playerId);

    if (error) {
      if (error.code === "PGRST205") {
        return emptyStats();
      }
      logger.error("Failed to fetch player review stats", { error: error.message, playerId });
      throw new Error(error.message ?? "Failed to fetch player review stats");
    }

    if (!data || data.length === 0) {
      return emptyStats();
    }

    const ratings = (data as { rating: number }[]).map((r) => r.rating);
    return computeStats(ratings);
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Apply ORDER BY based on the sort option */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySortOrder(query: any, sort: ReviewSortOption) {
  switch (sort) {
    case "date_asc":
      return query.order("created_at", { ascending: true });
    case "rating_desc":
      return query.order("rating", { ascending: false }).order("created_at", { ascending: false });
    case "rating_asc":
      return query.order("rating", { ascending: true }).order("created_at", { ascending: false });
    case "date_desc":
    default:
      return query.order("created_at", { ascending: false });
  }
}

/** Transform a raw Supabase row into a PlayerReviewItem */
function transformRow(row: ReviewRow): PlayerReviewItem {
  const game = row.games;
  const title = game?.game_translations?.[0]?.title ?? "";

  return {
    id: row.id,
    gameId: row.game_id,
    gameSlug: game?.slug ?? "",
    gameName: title,
    gameCoverUrl: game?.cover_image_url ?? null,
    rating: row.rating,
    content: row.content,
    positivePoints: row.positive_points ?? [],
    negativePoints: row.negative_points ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Return empty stats when no reviews exist */
function emptyStats(): PlayerReviewsStatsData {
  return {
    totalCount: 0,
    averageRating: null,
    distribution: RATING_RANGES.map((r) => ({
      range: r.range,
      count: 0,
      percentage: 0,
    })),
  };
}

/** Compute stats from an array of ratings */
function computeStats(ratings: number[]): PlayerReviewsStatsData {
  const totalCount = ratings.length;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const averageRating = Math.round((sum / totalCount) * 10) / 10;

  const distribution: RatingDistribution[] = RATING_RANGES.map(({ range, min, max }) => {
    const count = ratings.filter((r) => r >= min && r <= max).length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return { range, count, percentage };
  });

  return { totalCount, averageRating, distribution };
}
