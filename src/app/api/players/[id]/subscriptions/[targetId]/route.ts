import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string; targetId: string }> };

/**
 * DELETE /api/players/[id]/subscriptions/[targetId] — [id] se désabonne de targetId.
 * Requiert [id] === auth.uid(). Idempotent.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, targetId } = await params;

    if (!PlayerService.validatePlayerId(playerId) || !PlayerService.validatePlayerId(targetId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await SubscriptionServerService.unsubscribe(playerId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in subscription DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/players/[id]/subscriptions/[targetId] — Retourne le statut d'abonnement
 * entre [id] (spectateur) et targetId. Publique.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, targetId } = await params;

    if (!PlayerService.validatePlayerId(playerId) || !PlayerService.validatePlayerId(targetId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    const status = await SubscriptionServerService.getRelationship(playerId, targetId);
    return NextResponse.json(status);
  } catch (error) {
    logger.error("Error in subscription status GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
