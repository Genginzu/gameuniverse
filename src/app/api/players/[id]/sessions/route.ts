import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PlayerService } from "@/lib/services/playerService";
import { GameSessionsServerService } from "@/lib/services/gameSessionsServerService";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";
import type { GamingSessionsResponse } from "@/types/gaming-session";

const PAGE_SIZE = 20;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DURATION_MINUTES = 24 * 60;

// Fields are checked in the handler so the dedicated 400 messages stay unchanged.
const createSessionSchema = z.object({
  gameId: z.unknown().optional(),
  date: z.unknown().optional(),
  durationMinutes: z.unknown().optional(),
});

function parsePage(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw === null) return 1;
  const parsed = parseInt(raw, 10);
  return !isNaN(parsed) && parsed >= 1 ? parsed : 1;
}

/** GET /api/players/[id]/sessions — Paginated gaming sessions for a player. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Invalid player ID format" }, { status: 400 });
    }

    const playerExists = await PlayerService.playerExists(playerId);
    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams);
    const locale = searchParams.get("locale") || "fr";

    const { sessions, totalCount } = await GameSessionsServerService.fetchSessions(
      playerId,
      page,
      locale
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const hasNextPage = page < totalPages;

    const response: GamingSessionsResponse = {
      sessions,
      pagination: { currentPage: page, totalPages, totalCount, hasNextPage },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error in player sessions GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/players/[id]/sessions — Create a new gaming session. */
export const POST = defineRoute(
  { auth: "required", rateLimit: "gameSession", body: createSessionSchema },
  async ({ request, user, params, body }) => {
    const { id: playerId } = params;

    if (user.id !== playerId) {
      throw forbidden("Forbidden");
    }

    const gameId = typeof body.gameId === "string" ? body.gameId : "";
    const date = typeof body.date === "string" ? body.date : "";
    const durationMinutes =
      typeof body.durationMinutes === "number" ? Math.floor(body.durationMinutes) : NaN;

    if (!UUID_REGEX.test(gameId)) {
      throw validationError(undefined, "Invalid gameId");
    }
    if (!ISO_DATE_REGEX.test(date)) {
      throw validationError(undefined, "Invalid date (expected YYYY-MM-DD)");
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      throw validationError(undefined, "durationMinutes must be >= 1");
    }
    if (durationMinutes > MAX_DURATION_MINUTES) {
      throw validationError(undefined, `durationMinutes must be <= ${MAX_DURATION_MINUTES}`);
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    try {
      const session = await GameSessionsServerService.createSession(
        playerId,
        { gameId, date, durationMinutes },
        locale
      );
      return NextResponse.json(session, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // DB guard (migration 20261019000003): 24h per session / per day, no future start.
      if (message.startsWith("game_sessions:")) {
        throw validationError(undefined, message);
      }
      throw error;
    }
  }
);
