import { NextRequest, NextResponse } from "next/server";
import { HybridSearchService } from "@/lib/services/hybridSearchService";
import { HybridSearchResponse } from "@/types/search";

/**
 * GET /api/search/hybrid
 *
 * Performs a hybrid search combining local Supabase database and IGDB API results.
 *
 * Query Parameters:
 * - query (required): Search query string (minimum 2 characters)
 * - locale (optional): Locale for translations (default: "fr")
 * - localLimit (optional): Maximum local results (default: 5, max: 10)
 * - igdbLimit (optional): Maximum IGDB results (default: 5, max: 10)
 *
 * Requirements: 1.1, 1.2, 7.3
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<HybridSearchResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);

    // Extract and validate query parameter
    const query = searchParams.get("query")?.trim() || "";

    // Validate minimum query length (Requirement 1.1, 1.2)
    if (query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters long" },
        { status: 400 }
      );
    }

    // Extract optional parameters with defaults
    const locale = searchParams.get("locale") || "fr";

    // Parse and validate limits (Requirement 7.3: max 5 local + 5 IGDB initially, can expand to 500)
    const localLimitParam = parseInt(searchParams.get("localLimit") || "5", 10);
    const igdbLimitParam = parseInt(searchParams.get("igdbLimit") || "5", 10);

    // Clamp limits to valid range (1-500 for local, 1-499 for IGDB to allow hasMore check)
    const localLimit = Math.min(500, Math.max(1, isNaN(localLimitParam) ? 5 : localLimitParam));
    const igdbLimit = Math.min(499, Math.max(1, isNaN(igdbLimitParam) ? 5 : igdbLimitParam));

    // Perform hybrid search
    const searchResult = await HybridSearchService.search({
      query,
      locale,
      localLimit,
      igdbLimit,
    });

    // Convert to unified SearchResultItem format
    const results = HybridSearchService.toSearchResultItems(
      searchResult.localGames,
      searchResult.igdbGames
    );

    // Build response
    const response: HybridSearchResponse = {
      results,
      localCount: searchResult.localGames.length,
      igdbCount: searchResult.igdbGames.length,
      hasMore: searchResult.hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in hybrid search API:", error);
    return NextResponse.json({ error: "Internal server error during search" }, { status: 500 });
  }
}
