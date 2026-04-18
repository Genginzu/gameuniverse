import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { TRACKABLE_FIELDS } from "@/lib/utils/field-tracking";
import { syncGameField, syncAllGameFields } from "@/lib/services/igdb-sync";
import { fetchMetacriticScore } from "@/lib/services/metacriticService";
import type { TrackableField } from "@/types/admin-games";

/**
 * POST /api/admin/games/[id]/sync
 * Synchronise un ou tous les champs d'un jeu depuis IGDB.
 *
 * Body : { field?: string }
 * - Si field est fourni : sync ce champ uniquement
 * - Si field est absent : sync forcée de tous les champs
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id: gameId } = await params;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { field } = body as { field?: string };

    // Validate field name if provided
    if (field && !TRACKABLE_FIELDS.includes(field as TrackableField)) {
      return NextResponse.json({ error: `Invalid field: ${field}` }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch game to check igdb_id
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id, igdb_id")
      .eq("id", gameId)
      .single();

    if (fetchError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!game.igdb_id) {
      return NextResponse.json({ error: "Ce jeu n'est pas lié à IGDB" }, { status: 400 });
    }

    // Sync single field or all fields (forced — no override protection)
    let result;
    if (field === "metascore") {
      // Use Metacritic for metascore instead of IGDB
      const { data: gameData } = await supabase
        .from("games")
        .select("slug")
        .eq("id", gameId)
        .single();

      const slug = gameData?.slug;
      if (slug) {
        const score = await fetchMetacriticScore(slug);
        if (score !== null) {
          await supabase.from("games").update({ metascore: score }).eq("id", gameId);
          result = { success: true, syncedFields: ["metascore"] };
        } else {
          // Fallback to IGDB if Metacritic has no score
          result = await syncGameField(supabase as never, gameId, game.igdb_id, "metascore");
        }
      } else {
        result = await syncGameField(supabase as never, gameId, game.igdb_id, "metascore");
      }
    } else {
      result = field
        ? await syncGameField(supabase as never, gameId, game.igdb_id, field as TrackableField)
        : await syncAllGameFields(supabase as never, gameId, game.igdb_id);
    }

    if (!result.success) {
      // IGDB fetch failure → 502
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // Fetch updated game data to return
    const { data: updatedGame, error: updatedError } = await supabase
      .from("games")
      .select("id, slug, igdb_id, last_synced_at, updated_at")
      .eq("id", gameId)
      .single();

    return NextResponse.json({
      success: true,
      syncedFields: result.syncedFields,
      game: updatedError ? null : updatedGame,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
