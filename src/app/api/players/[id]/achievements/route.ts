import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { AchievementService } from "@/lib/services/achievementService";
import { logger } from "@/lib/logger";

/**
 * GET /api/players/[id]/achievements
 *
 * Retourne la liste complète des succès du catalogue avec le statut
 * débloqué/verrouillé pour le joueur spécifié.
 *
 * Query params:
 *  - locale (string, default "fr") — langue pour les traductions
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    // 400 — Invalid UUID format
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Invalid player ID format" }, { status: 400 });
    }

    // 404 — Player not found
    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const achievements = await AchievementService.fetchPlayerAchievements(playerId, locale);

    return NextResponse.json({ achievements });
  } catch (error) {
    logger.error("Error in player achievements API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
