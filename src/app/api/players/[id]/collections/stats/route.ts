import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { CollectionAdvancedStatsService } from "@/lib/services/collectionAdvancedStatsService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/collections/stats
 *
 * Aggregated advanced statistics across a player's visible collections:
 * genre/platform distribution, average rating, completion rate, total playtime.
 * Owner sees all collections; visitors see public ones only.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isOwner = user?.id === playerId;

    const stats = await CollectionAdvancedStatsService.fetchPlayerAdvancedStats(
      playerId,
      isOwner,
      locale
    );

    return NextResponse.json({ stats });
  } catch (error) {
    logger.error("Error in collections stats GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
