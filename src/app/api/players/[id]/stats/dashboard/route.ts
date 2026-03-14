import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { DashboardStatsService } from "@/lib/services/dashboardStatsService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { isStatsPrivate } from "@/lib/services/playerStatsDbHelpers";
import { validatePlayerId } from "@/lib/utils/statsFormatters";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { id: playerId } = await params;

    // Validate player ID format (UUID)
    if (!validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    // Get current user for privacy check
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const visitorId = user?.id ?? null;

    // Check player exists
    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    // Check privacy: if stats_private and visitor is not the owner
    const isOwner = visitorId === playerId;
    if (!isOwner) {
      const isPrivate = await isStatsPrivate(supabase, playerId);
      if (isPrivate) {
        return NextResponse.json({ stats: null, private: true });
      }
    }

    // Fetch all dashboard stats in parallel
    const stats = await DashboardStatsService.fetchAllStats(playerId, locale);
    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Error in player dashboard stats API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
