import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { AchievementService } from "@/lib/services/achievementService";
import { logger } from "@/lib/logger";

/**
 * GET /api/players/[id]/xp
 *
 * Retourne les stats XP/niveau d'un joueur :
 * xpTotal, level, currentLevelXp, nextLevelXp, progressPercent.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const xpStats = await AchievementService.fetchPlayerXp(playerId);

    return NextResponse.json(xpStats);
  } catch (error) {
    logger.error("Error in player XP API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
