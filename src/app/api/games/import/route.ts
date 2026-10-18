import { NextRequest, NextResponse } from "next/server";
import { GameImportService } from "@/lib/services/gameImportService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getUserRoleFromUser } from "@/lib/auth-admin";
import {
  checkImportRateLimit,
  recordImportEvent,
  IMPORT_RATE_LIMIT,
} from "@/lib/services/gameImportRateLimit";
import { logger } from "@/lib/logger";

/**
 * POST /api/games/import
 *
 * Imports a game from IGDB into the local Supabase database.
 *
 * Security & limits (issue #376):
 * - Requires an authenticated user (401 otherwise, no IGDB call, no DB write).
 * - A game already present in the catalogue is returned immediately, with no
 *   IGDB call and no rate-limit charge.
 * - Non-admin users are limited to IMPORT_RATE_LIMIT imports per hour; over
 *   the limit returns 429 with a `Retry-After` header. Admins are exempt.
 *
 * Request Body:
 * - igdbId (required): The IGDB game ID to import
 *
 * Returns:
 * - 200: Game already existed, returned without IGDB calls
 * - 201: Game created successfully
 * - 400: Invalid request (missing or invalid igdbId)
 * - 401: Unauthenticated
 * - 404: IGDB game not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // --- Authentication (before any IGDB call or DB write) ---
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Parse request body
    let body: { igdbId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Validate igdbId
    const { igdbId } = body;

    if (igdbId === undefined || igdbId === null) {
      return NextResponse.json({ error: "igdbId is required" }, { status: 400 });
    }

    const parsedIgdbId = typeof igdbId === "number" ? igdbId : parseInt(String(igdbId), 10);

    if (isNaN(parsedIgdbId) || parsedIgdbId <= 0) {
      return NextResponse.json({ error: "igdbId must be a positive integer" }, { status: 400 });
    }

    // --- Existing game short-circuit (no IGDB call, no rate-limit charge) ---
    const existing = await GameImportService.findExistingGameByIgdbId(parsedIgdbId);
    if (existing) {
      return NextResponse.json(
        { success: true, game: existing.game, message: "Game already imported" },
        { status: 200 }
      );
    }

    // --- Rate limit (admins exempt) ---
    const isAdmin = getUserRoleFromUser(user) === "admin";
    if (!isAdmin) {
      const rateLimit = await checkImportRateLimit(user.id);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: `Import rate limit exceeded (${IMPORT_RATE_LIMIT} imports per hour)`,
          },
          {
            status: 429,
            headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
          }
        );
      }
    }

    // --- Import from IGDB ---
    const result = await GameImportService.importFromIGDB(parsedIgdbId);

    if (!result.success) {
      if (result.error?.includes("not found")) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ error: result.error || "Failed to import game" }, { status: 500 });
    }

    // Charge the import against the user's window (best-effort). Admins are
    // recorded too, for audit, but are never blocked by the count.
    await recordImportEvent(user.id, parsedIgdbId, result.game?.id ?? null);

    return NextResponse.json(
      {
        success: true,
        game: result.game,
        message: "Game imported successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in game import API", { error });
    return NextResponse.json({ error: "Internal server error during import" }, { status: 500 });
  }
}
