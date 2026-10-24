import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { defineRoute, validationError } from "@/lib/api/route";

/**
 * GET /api/admin/games/[id]/overrides
 * Retourne la liste des overrides (champs modifiés manuellement) pour un jeu.
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: gameId } = params;

  if (!gameId) {
    throw validationError(undefined, "Game ID is required");
  }

  const supabase = await createRouteHandlerClient();

  const { data: overrides, error } = await untypedTable(supabase, "game_field_overrides")
    .select("id, game_id, field_name, modified_by, modified_at")
    .eq("game_id", gameId);

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch overrides: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ overrides: overrides ?? [] });
});
