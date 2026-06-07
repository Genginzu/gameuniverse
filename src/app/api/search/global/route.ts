import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { GlobalSearchService } from "@/lib/services/globalSearchService";
import type { GlobalSearchResponse } from "@/types/global-search";
import { logger } from "@/lib/logger";

/**
 * Zod schema for the GET query string.
 *
 * - `query` is required, ≥ 2 chars after trim.
 * - `locale` defaults to "fr".
 * - All `*Limit` params accept positive integers; missing or invalid values
 *   fall back to the service's defaults (5 for character/player/team/proPlayer/coach).
 */
const QuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Query must be at least 2 characters long"),
  locale: z.string().trim().min(1).default("fr"),
  charactersLimit: z.coerce.number().int().positive().optional(),
  playersLimit: z.coerce.number().int().positive().optional(),
  teamsLimit: z.coerce.number().int().positive().optional(),
  proPlayersLimit: z.coerce.number().int().positive().optional(),
  coachesLimit: z.coerce.number().int().positive().optional(),
});

/**
 * GET /api/search/global
 *
 * Performs a global search across the 6 supported entity types: games,
 * characters, players (Gamers Universe), esport teams, esport pro players,
 * and coaches. Each source runs in parallel via `Promise.allSettled` so
 * a single backend failure does not break the whole response.
 *
 * Query Parameters:
 * - `query` (required): Search string, ≥ 2 characters after trim
 * - `locale` (optional): "fr" by default
 * - `charactersLimit` / `playersLimit` / `teamsLimit` /
 *   `proPlayersLimit` / `coachesLimit` (optional): Per-group cap.
 *   Games are not capped (returned in full from local DB + IGDB).
 *
 * Requirements: 1.1, 1.4, 2.5, 8.1 + F0-07d (esport teams/pro players, coaches)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GlobalSearchResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);

    // Build a plain object from the URLSearchParams to feed Zod. Multi-valued
    // params would be lost here, but our query-string contract is single-valued.
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value !== "") raw[key] = value;
    }

    const parsed = QuerySchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid query parameters" },
        { status: 400 }
      );
    }

    const result = await GlobalSearchService.search(parsed.data);

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
