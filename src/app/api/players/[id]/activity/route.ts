import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { ActivityServerService } from "@/lib/services/activityServerService";
import { logger } from "@/lib/logger";
import type { ActivityEventType } from "@/types/activity";

/** Valid activity event types for filter validation */
const VALID_EVENT_TYPES: Set<string> = new Set<string>([
  "review",
  "comment",
  "library",
  "playtime",
  "favorite",
  "collection",
  "friendship",
]);

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
 * Parse the type filter query parameter.
 * Returns undefined for invalid or missing values (all events).
 */
function parseTypeFilter(searchParams: URLSearchParams): ActivityEventType | undefined {
  const raw = searchParams.get("type");
  if (raw === null) return undefined;

  return VALID_EVENT_TYPES.has(raw) ? (raw as ActivityEventType) : undefined;
}

/**
 * GET /api/players/[id]/activity — Retourne le flux d'activité paginé d'un joueur.
 *
 * Query params:
 *  - page   (number, default 1)  — numéro de page
 *  - type   (ActivityEventType)  — filtre optionnel par type d'événement
 *  - locale (string, default "fr") — langue pour les traductions
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    // 400 — Invalid UUID format
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Format d'identifiant invalide" }, { status: 400 });
    }

    // 404 — Player not found
    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);
    const type = parseTypeFilter(searchParams);
    const locale = searchParams.get("locale") || "fr";

    const activityResponse = await ActivityServerService.fetchPlayerActivity(
      playerId,
      locale,
      type,
      page
    );

    return NextResponse.json(activityResponse);
  } catch (error) {
    logger.error("Error in player activity API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
