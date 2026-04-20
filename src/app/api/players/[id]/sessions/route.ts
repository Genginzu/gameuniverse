import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerService } from "@/lib/services/playerService";
import { GameSessionsServerService } from "@/lib/services/gameSessionsServerService";
import { logger } from "@/lib/logger";
import type { GamingSessionsResponse } from "@/types/gaming-session";

const PAGE_SIZE = 20;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DURATION_MINUTES = 24 * 60;

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
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const gameId = typeof body?.gameId === "string" ? body.gameId : "";
    const date = typeof body?.date === "string" ? body.date : "";
    const durationMinutes =
      typeof body?.durationMinutes === "number" ? Math.floor(body.durationMinutes) : NaN;

    if (!UUID_REGEX.test(gameId)) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }
    if (!ISO_DATE_REGEX.test(date)) {
      return NextResponse.json({ error: "Invalid date (expected YYYY-MM-DD)" }, { status: 400 });
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      return NextResponse.json({ error: "durationMinutes must be >= 1" }, { status: 400 });
    }
    if (durationMinutes > MAX_DURATION_MINUTES) {
      return NextResponse.json(
        { error: `durationMinutes must be <= ${MAX_DURATION_MINUTES}` },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const session = await GameSessionsServerService.createSession(
      playerId,
      { gameId, date, durationMinutes },
      locale
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    logger.error("Error in player sessions POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
