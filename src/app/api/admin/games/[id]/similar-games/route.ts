import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { untypedTable } from "@/lib/utils/untypedTable";

interface SimilarGameRow {
  id: string;
  similar_igdb_id: number;
  similar_game_id: string | null;
  display_order: number;
}

interface ResolvedSimilarGame {
  id: string;
  similarIgdbId: number;
  displayOrder: number;
  game: {
    id: string;
    slug: string;
    title: string;
    coverImage: string | null;
  } | null;
}

/** GET — list similar games for a game */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: gameId } = await params;
    const supabase = await createRouteHandlerClient();

    const { data: rows, error } = await untypedTable(supabase, "game_similar_games")
      .select("id, similar_igdb_id, similar_game_id, display_order")
      .eq("game_id", gameId)
      .order("display_order", { ascending: true });

    if (error) {
      logger.error("Failed to fetch similar games", { error });
      return NextResponse.json({ error: "Failed to fetch similar games" }, { status: 500 });
    }

    // Resolve local game details
    const resolvedIds = (rows as SimilarGameRow[])
      .map((r) => r.similar_game_id)
      .filter((id): id is string => id !== null);

    const gameMap = new Map<
      string,
      { id: string; slug: string; title: string; coverImage: string | null }
    >();

    if (resolvedIds.length > 0) {
      const { data: games } = await supabase
        .from("games")
        .select("id, slug, cover_image_url, game_translations(title, language_code)")
        .in("id", resolvedIds);

      for (const g of games ?? []) {
        const translations = (g.game_translations ?? []) as Array<{
          title: string;
          language_code: string;
        }>;
        const t =
          translations.find((tr) => tr.language_code === "fr") ||
          translations.find((tr) => tr.language_code === "en") ||
          translations[0];
        gameMap.set(g.id, {
          id: g.id,
          slug: g.slug,
          title: t?.title || g.slug,
          coverImage: g.cover_image_url,
        });
      }
    }

    const result: ResolvedSimilarGame[] = (rows as SimilarGameRow[]).map((r) => ({
      id: r.id,
      similarIgdbId: r.similar_igdb_id,
      displayOrder: r.display_order,
      game: r.similar_game_id ? (gameMap.get(r.similar_game_id) ?? null) : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error in similar games GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST — add a similar game by slug (local game) */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: gameId } = await params;
    const body = await request.json();
    const { gameSlug } = body as { gameSlug?: string };

    if (!gameSlug) {
      return NextResponse.json({ error: "gameSlug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Find the target game
    const { data: targetGame, error: findError } = await supabase
      .from("games")
      .select("id, igdb_id")
      .eq("slug", gameSlug)
      .single();

    if (findError || !targetGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (targetGame.id === gameId) {
      return NextResponse.json(
        { error: "Cannot add a game as similar to itself" },
        { status: 400 }
      );
    }

    // Get current max display_order
    const { data: existing } = await untypedTable(supabase, "game_similar_games")
      .select("display_order")
      .eq("game_id", gameId)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder =
      existing && existing.length > 0
        ? (existing[0] as { display_order: number }).display_order + 1
        : 0;

    const { data: inserted, error: insertError } = await untypedTable(
      supabase,
      "game_similar_games"
    )
      .insert({
        game_id: gameId,
        similar_igdb_id: targetGame.igdb_id ?? 0,
        similar_game_id: targetGame.id,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This game is already in similar games" },
          { status: 409 }
        );
      }
      logger.error("Failed to add similar game", { error: insertError });
      return NextResponse.json({ error: "Failed to add similar game" }, { status: 500 });
    }

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (error) {
    logger.error("Error in similar games POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE — remove a similar game entry */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "entryId query param is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { error } = await untypedTable(supabase, "game_similar_games")
      .delete()
      .eq("id", entryId)
      .eq("game_id", gameId);

    if (error) {
      logger.error("Failed to delete similar game", { error });
      return NextResponse.json({ error: "Failed to delete similar game" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in similar games DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
