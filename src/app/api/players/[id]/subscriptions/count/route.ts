import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/subscriptions/count — Retourne les compteurs
 * d'abonnés (followers) et d'abonnements (following) de [id]. Publique.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    const counts = await SubscriptionServerService.getCounts(playerId);
    return NextResponse.json(counts);
  } catch (error) {
    logger.error("Error in subscriptions count GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
