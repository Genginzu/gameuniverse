import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";
import { logger } from "@/lib/logger";

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

/**
 * POST /api/players/[id]/subscriptions — [id] s'abonne à targetId (body).
 * Requiert que [id] === auth.uid(). Idempotent.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
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

    const body = await request.json().catch(() => null);
    const targetId = body?.targetId;

    if (!targetId || !PlayerService.validatePlayerId(targetId)) {
      return NextResponse.json({ error: "targetId invalide" }, { status: 400 });
    }

    if (targetId === playerId) {
      return NextResponse.json({ error: "Cannot subscribe to yourself" }, { status: 400 });
    }

    await SubscriptionServerService.subscribe(playerId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in subscriptions POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
