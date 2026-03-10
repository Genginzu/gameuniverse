import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerReviewsServerService } from "@/lib/services/playerReviewsServerService";
import { logger } from "@/lib/logger";
import type { ReviewSortOption, PlayerReviewsResponse } from "@/types/playerReview";

const PAGE_SIZE = 10;

/** Valid sort options */
const VALID_SORT_OPTIONS: Set<string> = new Set([
  "date_desc",
  "date_asc",
  "rating_desc",
  "rating_asc",
]);

/**
 * Parse and validate the page query parameter.
 * Returns 1 for invalid or missing values.
 */
function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;

  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * Parse the sort query parameter.
 * Falls back to "date_desc" for invalid or missing values.
 */
function parseSort(searchParams: URLSearchParams): ReviewSortOption {
  const raw = searchParams.get("sort");
  if (raw !== null && VALID_SORT_OPTIONS.has(raw)) {
    return raw as ReviewSortOption;
  }
  return "date_desc";
}

/**
 * GET /api/players/[id]/reviews — Returns paginated reviews for a player.
 *
 * Query params:
 *  - page   (number, default 1)       — page number
 *  - sort   (ReviewSortOption)         — sort order, default "date_desc"
 *  - locale (string, default "fr")     — language for game translations
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    // 400 — Invalid UUID format
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    // 404 — Player not found
    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);
    const sort = parseSort(searchParams);
    const locale = searchParams.get("locale") || "fr";

    // Fetch paginated reviews
    const { reviews, totalCount } = await PlayerReviewsServerService.fetchPlayerReviews(
      playerId,
      locale,
      sort,
      page
    );

    // Compute pagination
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const hasNextPage = page < totalPages;

    // Stats are only fetched for page 1 (they don't change between pages)
    const stats =
      page === 1
        ? await PlayerReviewsServerService.fetchPlayerReviewsStats(playerId)
        : {
            totalCount: 0,
            averageRating: null,
            distribution: [
              { range: "0-5", count: 0, percentage: 0 },
              { range: "6-10", count: 0, percentage: 0 },
              { range: "11-15", count: 0, percentage: 0 },
              { range: "16-20", count: 0, percentage: 0 },
            ],
          };

    const response: PlayerReviewsResponse = {
      reviews,
      stats,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in player reviews API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
