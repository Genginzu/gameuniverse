import { NextRequest, NextResponse } from "next/server";
import { GlobalSearchService } from "@/lib/services/globalSearchService";
import type { GlobalSearchResponse } from "@/types/global-search";
import { logger } from "@/lib/logger";

const DEFAULT_LIMIT = 5;

/**
 * GET /api/search/global
 *
 * Performs a global search across games, characters, and players.
 *
 * Query Parameters:
 * - query (required): Search query string (minimum 2 characters after trim)
 * - locale (optional): Locale for translations (default: "fr")
 * - gamesLimit (optional): Maximum game results (default: 5)
 * - charactersLimit (optional): Maximum character results (default: 5)
 * - playersLimit (optional): Maximum player results (default: 5)
 *
 * Requirements: 1.1, 1.4, 2.5, 8.1
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GlobalSearchResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query")?.trim() || "";

    // Validate minimum query length (Requirement 1.4)
    if (query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters long" },
        { status: 400 }
      );
    }

    const locale = searchParams.get("locale") || "fr";

    // Parse optional limit parameters with defaults (Requirement 2.5)
    const gamesLimit = parseLimit(searchParams.get("gamesLimit"));
    const charactersLimit = parseLimit(searchParams.get("charactersLimit"));
    const playersLimit = parseLimit(searchParams.get("playersLimit"));

    const result = await GlobalSearchService.search({
      query,
      locale,
      gamesLimit,
      charactersLimit,
      playersLimit,
    });

    // Surface IGDB/search errors for debugging
    if (result.errors.length > 0) {
      logger.warn("[GlobalSearch] Partial failures", { errors: result.errors });
    }

    const response = GlobalSearchService.toGlobalSearchResponse(result);

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in global search API", { error });
    return NextResponse.json({ error: "Internal server error during search" }, { status: 500 });
  }
}

/** Parses a limit query param to a positive integer, falling back to DEFAULT_LIMIT. */
function parseLimit(value: string | null): number {
  if (value === null) return DEFAULT_LIMIT;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? DEFAULT_LIMIT : parsed;
}
