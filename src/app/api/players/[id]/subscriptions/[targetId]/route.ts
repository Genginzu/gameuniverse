import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";

type RouteContext = { params: Promise<{ id: string; targetId: string }> };

/**
 * DELETE /api/players/[id]/subscriptions/[targetId] — [id] se désabonne de targetId.
 * Requiert [id] === auth.uid(). Idempotent.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { id: playerId, targetId } = params;

  if (!PlayerService.validatePlayerId(playerId) || !PlayerService.validatePlayerId(targetId)) {
    throw validationError(undefined, "Format d'identifiant invalide");
  }

  if (user.id !== playerId) throw forbidden("Forbidden");

  await SubscriptionServerService.unsubscribe(playerId, targetId);
  return NextResponse.json({ success: true });
});

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
