import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { FeedServerService } from "@/lib/services/feedServerService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

/**
 * Parse and validate the page query parameter.
 * Returns 1 for invalid or missing values.
 */
function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;

  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * GET /api/players/[id]/feed — Retourne le fil d'actualité paginé du
 * propriétaire (agrège reviews, posts, playtime des joueurs suivis).
 *
 * Owner-only : 403 si l'utilisateur authentifié n'est pas le player id demandé.
 *
 * Query params:
 *  - page   (number, default 1)  — numéro de page
 *  - locale (string, default "fr") — langue pour les traductions
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    // 400 — Invalid UUID format
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    // 401 / 403 — Owner-only endpoint
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

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);
    const locale = searchParams.get("locale") || "fr";

    const feedResponse = await FeedServerService.fetchSubscribedFeed(playerId, locale, page);

    return NextResponse.json(feedResponse);
  } catch (error) {
    logger.error("Error in player feed API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
