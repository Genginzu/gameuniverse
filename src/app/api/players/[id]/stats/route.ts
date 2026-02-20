import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerStatsService } from "@/lib/services/playerStatsService";
import { createRouteHandlerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { id: playerId } = await params;

    // Validate player ID format (UUID)
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    // Get current user for privacy check
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const visitorId = user?.id ?? null;

    // Fetch enriched stats (handles privacy internally)
    const stats = await PlayerStatsService.fetchEnrichedStats(playerId, locale, visitorId);

    if (stats === null) {
      // Distinguish between "player not found" and "stats are private"
      const playerExists = await PlayerService.playerExists(playerId);
      if (!playerExists) {
        return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
      }
      // Player exists but stats are private
      return NextResponse.json({ stats: null, private: true });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error in player stats API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
