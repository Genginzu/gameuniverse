import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/library-sync/igdb-search?q=<name>&limit=<n>
 *
 * Searches IGDB directly (not the local DB) so an admin can link an unmatched
 * platform title to any IGDB game — even one not yet imported locally. The
 * link step imports the game if needed.
 */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20") || 20, 1), 50);

  if (query.length < 2) return NextResponse.json([]);

  try {
    const results = await IGDBService.searchGames(query, limit);
    return NextResponse.json(
      results.map((r) => ({
        igdbId: r.id,
        name: r.name,
        slug: r.slug,
        coverUrl: r.cover_url ?? null,
        releaseYear: r.release_year ?? null,
        developer: r.developer ?? null,
      }))
    );
  } catch (error) {
    logger.error("Admin IGDB search failed", { error });
    return NextResponse.json({ error: "IGDB search failed" }, { status: 502 });
  }
});
