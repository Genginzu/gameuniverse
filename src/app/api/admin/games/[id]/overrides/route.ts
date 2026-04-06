import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { requireAdmin } from "@/lib/auth-admin";

/**
 * GET /api/admin/games/[id]/overrides
 * Retourne la liste des overrides (champs modifiés manuellement) pour un jeu.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id: gameId } = await params;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
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
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
