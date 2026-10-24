import { NextResponse } from "next/server";
import { z } from "zod";
import { GameImportService } from "@/lib/services/gameImportService";
import { getUserRoleFromUser } from "@/lib/utils/userRole";
import {
  checkImportRateLimit,
  recordImportEvent,
  IMPORT_RATE_LIMIT,
} from "@/lib/services/gameImportRateLimit";
import { defineRoute, notFound, validationError } from "@/lib/api/route";

// igdbId is checked in the handler so the dedicated 400 messages stay unchanged.
const importBodySchema = z.object({ igdbId: z.unknown().optional() });

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
export const POST = defineRoute(
  { auth: "required", body: importBodySchema },
  async ({ user, body }) => {
    // Validate igdbId
    const { igdbId } = body;

    if (igdbId === undefined || igdbId === null) {
      throw validationError(undefined, "igdbId is required");
    }

    const parsedIgdbId = typeof igdbId === "number" ? igdbId : parseInt(String(igdbId), 10);

    if (isNaN(parsedIgdbId) || parsedIgdbId <= 0) {
      throw validationError(undefined, "igdbId must be a positive integer");
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
        throw notFound(result.error);
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
  }
);
