import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { removeItem } from "@/lib/services/collectionService";

type RouteContext = { params: Promise<{ id: string; slug: string; gameId: string }> };

/**
 * DELETE /api/players/[id]/collections/[slug]/items/[gameId] — Retirer un jeu d'une collection.
 * Authentification requise. Seul le propriétaire peut retirer des jeux.
 * Réordonne automatiquement les positions restantes.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, slug, gameId } = await params;

    if (!playerId || !slug || !gameId) {
      return NextResponse.json(
        { error: "Player ID, slug, and game ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await removeItem(user.id, slug, gameId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error in players/[id]/collections/[slug]/items/[gameId] DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
