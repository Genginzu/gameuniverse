import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/subscribers — Liste des joueurs abonnés à [id].
 * Publique (RLS autorise SELECT pour tous).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    const subscriptions = await SubscriptionServerService.getSubscribers(playerId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    logger.error("Error in subscribers GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
