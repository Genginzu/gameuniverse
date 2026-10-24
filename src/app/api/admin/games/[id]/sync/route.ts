import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { isTrackableField } from "@/lib/services/igdb-fields/registry";
import { syncGameField, syncAllGameFields } from "@/lib/services/igdb-sync";
import { fetchMetacriticScore } from "@/lib/services/metacriticService";

const syncGameSchema = z.object({
  field: z.string().optional(),
});

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
export const POST = defineRoute(
  { auth: "admin", body: syncGameSchema },
  async ({ params, body }) => {
    const { id: gameId } = params;

    if (!gameId) {
      throw validationError(undefined, "Game ID is required");
    }

    const { field } = body;

    // Validate field name if provided
    const requestedField = isTrackableField(field) ? field : null;
    if (field && !requestedField) {
      throw validationError(undefined, `Invalid field: ${field}`);
    }

    const supabase = await createRouteHandlerClient();

    // Fetch game to check igdb_id
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id, igdb_id")
      .eq("id", gameId)
      .single();

    if (fetchError || !game) {
      throw notFound("Game not found");
    }

    if (!game.igdb_id) {
      throw validationError(undefined, "Ce jeu n'est pas lié à IGDB");
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
      result = requestedField
        ? await syncGameField(supabase as never, gameId, game.igdb_id, requestedField)
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
  }
);
