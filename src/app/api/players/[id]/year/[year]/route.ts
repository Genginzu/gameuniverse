import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { PlayerStatsService } from "@/lib/services/playerStatsService";
import { createRouteHandlerClient } from "@/lib/supabase-server";

const YEAR_REGEX = /^\d{4}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; year: string }> }
) {
  try {
    const { id: playerId, year: yearStr } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    // Validate player ID format (UUID)
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    // Validate year format (4-digit number)
    if (!YEAR_REGEX.test(yearStr)) {
      return NextResponse.json({ error: "Format d'année invalide" }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);

    // Validate year is not in the future
    if (year > new Date().getFullYear()) {
      return NextResponse.json({ error: "L'année demandée est dans le futur" }, { status: 400 });
    }

    // Get current user for privacy check
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const visitorId = user?.id ?? null;

    // Fetch year in review (handles privacy internally)
    const yearReview = await PlayerStatsService.fetchYearInReview(
      playerId,
      year,
      locale,
      visitorId
    );

    if (yearReview === null) {
      // Distinguish between "player not found" and "stats are private"
      const playerExists = await PlayerService.playerExists(playerId);
      if (!playerExists) {
        return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
      }
      // Player exists but stats are private
      return NextResponse.json({ yearReview: null, private: true });
    }

    return NextResponse.json({ yearReview });
  } catch (error) {
    console.error("Error in year review API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
