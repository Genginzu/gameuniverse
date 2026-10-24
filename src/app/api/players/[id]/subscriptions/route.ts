import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PlayerService } from "@/lib/services/playerService";
import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/subscriptions — Liste des joueurs suivis par [id].
 * Publique (RLS autorise SELECT pour tous).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    const subscriptions = await SubscriptionServerService.getSubscriptions(playerId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    logger.error("Error in subscriptions GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const subscribeSchema = z.looseObject({ targetId: z.any().optional() });

/**
 * POST /api/players/[id]/subscriptions — [id] s'abonne à targetId (body).
 * Requiert que [id] === auth.uid(). Idempotent.
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "follow", body: subscribeSchema },
  async ({ user, params, body }) => {
    const { id: playerId } = params;

    if (!PlayerService.validatePlayerId(playerId)) {
      throw validationError(undefined, "Format d'identifiant invalide");
    }

    if (user.id !== playerId) throw forbidden("Forbidden");

    const targetId = body.targetId;

    if (!targetId || !PlayerService.validatePlayerId(targetId)) {
      throw validationError(undefined, "targetId invalide");
    }

    if (targetId === playerId) throw validationError(undefined, "Cannot subscribe to yourself");

    await SubscriptionServerService.subscribe(playerId, targetId);
    return NextResponse.json({ success: true });
  }
);
