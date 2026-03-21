import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { parsePaginationParams } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/library — Paginated library for a player.
 * Returns games sorted by added_at desc with locale-aware titles.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePaginationParams(searchParams);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Count total
    const { count: totalCount } = await supabase
      .from("user_library")
      .select("id", { count: "exact", head: true })
      .eq("user_id", playerId);

    // Fetch page
    const { data, error } = await supabase
      .from("user_library")
      .select(
        `
        id, game_id, status,
        play_time_hastily, play_time_normally, play_time_completely,
        rating, added_at,
        games(id, slug, cover_image_url, game_translations(title, language_code))
      `
      )
      .eq("user_id", playerId)
      .order("added_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching player library", { playerId, error });
      return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
    }

    const games = (data || [])
      .map((entry) => {
        const game = entry.games as {
          id: string;
          slug: string;
          cover_image_url: string | null;
          game_translations: { title: string; language_code: string }[] | null;
        } | null;
        if (!game) return null;

        const translation =
          game.game_translations?.find((t) => t.language_code === locale) ||
          game.game_translations?.[0];

        return {
          id: entry.id,
          gameId: entry.game_id,
          slug: game.slug,
          title: translation?.title || "Unknown",
          coverImage: game.cover_image_url,
          status: entry.status,
          playTimeHours: Math.max(
            entry.play_time_completely || 0,
            entry.play_time_normally || 0,
            entry.play_time_hastily || 0
          ),
          rating: entry.rating,
          addedAt: entry.added_at,
        };
      })
      .filter(Boolean);

    const total = totalCount ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      games,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    logger.error("Error in player library GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
