import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CharacterFavoriteService } from "@/lib/services/characterFavoriteService";
import { logger } from "@/lib/logger";

/**
 * GET /api/favorites/characters — Liste des personnages favoris de l'utilisateur courant.
 * Requiert authentification.
 * Retourne : { characters: CharacterFavoriteSummary[] }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const characters = await CharacterFavoriteService.getUserFavorites(user.id, locale);

    return NextResponse.json({ characters });
  } catch (error) {
    logger.error("Error in favorites/characters GET API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
