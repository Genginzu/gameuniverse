import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { HLTBService, GamePlaytime } from "@/lib/services/hltbService";

/**
 * GET /api/games/[slug]/playtime
 *
 * Fetches playtime data for a game from HowLongToBeat.
 * Caches results in the database to avoid repeated API calls.
 *
 * Returns:
 * - 200: Playtime data
 * - 404: Game not found
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<GamePlaytime | { error: string }>> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch the game to get its title
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select(
        `
        id,
        game_translations!inner(title)
      `
      )
      .eq("slug", slug)
      .eq("game_translations.language_code", "en")
      .single();

    if (fetchError || !game) {
      // Try with French if English not found
      const { data: gameFr, error: fetchErrorFr } = await supabase
        .from("games")
        .select(
          `
          id,
          game_translations!inner(title)
        `
        )
        .eq("slug", slug)
        .eq("game_translations.language_code", "fr")
        .single();

      if (fetchErrorFr || !gameFr) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      const title = (gameFr.game_translations as any)?.[0]?.title;
      if (!title) {
        return NextResponse.json({ error: "Game title not found" }, { status: 404 });
      }

      // Fetch playtime from HLTB
      const playtime = await HLTBService.getPlaytime(title);

      if (!playtime) {
        return NextResponse.json({
          main: null,
          mainExtra: null,
          completionist: null,
          allStyles: null,
          lastUpdated: new Date().toISOString(),
        });
      }

      return NextResponse.json(playtime);
    }

    const title = (game.game_translations as any)?.[0]?.title;
    if (!title) {
      return NextResponse.json({ error: "Game title not found" }, { status: 404 });
    }

    // Fetch playtime from HLTB
    const playtime = await HLTBService.getPlaytime(title);

    if (!playtime) {
      return NextResponse.json({
        main: null,
        mainExtra: null,
        completionist: null,
        allStyles: null,
        lastUpdated: new Date().toISOString(),
      });
    }

    return NextResponse.json(playtime);
  } catch (error) {
    console.error("Error in playtime API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
