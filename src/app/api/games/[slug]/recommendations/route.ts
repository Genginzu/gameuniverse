import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getRecommendationsForGame } from "@/lib/services/recommendationService";
import { fetchUserLibraryGameIds } from "@/lib/services/recommendation/dataFetchers";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = await createRouteHandlerClient();

    // Resolve slug to game ID
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("slug", slug)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Optional authentication for library exclusion
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let excludeGameIds: string[] = [];
    if (user) {
      excludeGameIds = await fetchUserLibraryGameIds(user.id);
    }

    // Parse optional limit query param (default 10, fallback to 10 if invalid)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit = 10;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = parsed;
      }
    }

    const recommendations = await getRecommendationsForGame(game.id, {
      limit,
      excludeGameIds,
    });

    return NextResponse.json({
      recommendations,
      sourceGameId: game.id,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error computing recommendations", { error });
    return NextResponse.json({ error: "Failed to compute recommendations" }, { status: 500 });
  }
}
