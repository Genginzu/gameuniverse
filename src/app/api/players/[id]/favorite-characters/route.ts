import { NextRequest, NextResponse } from "next/server";
import { CharacterFavoriteService } from "@/lib/services/characterFavoriteService";

/**
 * GET /api/players/[id]/favorite-characters — Favoris publics d'un joueur.
 * Pas d'authentification requise.
 * Retourne : { characters: CharacterFavoriteSummary[] }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const characters = await CharacterFavoriteService.getPlayerFavorites(playerId, locale);

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("Error in players/[id]/favorite-characters GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
