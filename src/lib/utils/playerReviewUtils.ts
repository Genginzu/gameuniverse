import type {
  PlayerReviewItem,
  PlayerReviewsQueryParams,
  RatingDistribution,
  ReviewSortOption,
} from "@/types/playerReview";

// ---------------------------------------------------------------------------
// Raw record interface (DB-like shape before transformation)
// ---------------------------------------------------------------------------

/** Shape of a raw review record coming from the database / API layer */
export interface RawReviewRecord {
  id: string;
  game_id: string;
  game_slug: string;
  game_name: string;
  game_cover_url: string | null;
  rating: number;
  content: string;
  positive_points: string[];
  negative_points: string[];
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Rating distribution ranges
// ---------------------------------------------------------------------------

const RATING_RANGES: { range: string; min: number; max: number }[] = [
  { range: "0-5", min: 0, max: 5 },
  { range: "6-10", min: 6, max: 10 },
  { range: "11-15", min: 11, max: 15 },
  { range: "16-20", min: 16, max: 20 },
];

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

/**
 * Build the API URL for fetching player reviews.
 * Only includes query params whose value is not undefined.
 */
export function buildReviewsUrl(playerId: string, params: PlayerReviewsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.sort !== undefined) {
    searchParams.set("sort", params.sort);
  }
  if (params.locale !== undefined) {
    searchParams.set("locale", params.locale);
  }

  const query = searchParams.toString();
  return `/api/players/${playerId}/reviews${query ? `?${query}` : ""}`;
}

/**
 * Compute pagination metadata from total count, current page and page size.
 */
export function computeReviewsPagination(
  totalCount: number,
  page: number,
  pageSize: number
): { totalPages: number; hasNextPage: boolean } {
  const totalPages = totalCount <= 0 || pageSize <= 0 ? 0 : Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  return { totalPages, hasNextPage };
}

/**
 * Compute the rating distribution across 4 ranges (0-5, 6-10, 11-15, 16-20).
 * Each range includes count and percentage (rounded to nearest integer).
 */
export function computeRatingDistribution(ratings: number[]): RatingDistribution[] {
  const total = ratings.length;

  return RATING_RANGES.map(({ range, min, max }) => {
    const count = ratings.filter((r) => r >= min && r <= max).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { range, count, percentage };
  });
}

/**
 * Sort a list of reviews by the given sort option.
 * Returns a new array (does not mutate the input).
 *
 * Tie-breaking for rating sorts: most recent first (createdAt DESC).
 */
export function sortReviews(
  reviews: PlayerReviewItem[],
  sortOption: ReviewSortOption
): PlayerReviewItem[] {
  const copy = [...reviews];

  switch (sortOption) {
    case "date_desc":
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "date_asc":
      return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "rating_desc":
      return copy.sort((a, b) => {
        const diff = b.rating - a.rating;
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case "rating_asc":
      return copy.sort((a, b) => {
        const diff = a.rating - b.rating;
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    default:
      return copy;
  }
}

/**
 * Transform a raw database-like record into a clean PlayerReviewItem.
 */
export function transformReviewRecord(record: RawReviewRecord): PlayerReviewItem {
  return {
    id: record.id,
    gameId: record.game_id,
    gameSlug: record.game_slug,
    gameName: record.game_name,
    gameCoverUrl: record.game_cover_url,
    rating: record.rating,
    content: record.content,
    positivePoints: record.positive_points ?? [],
    negativePoints: record.negative_points ?? [],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
