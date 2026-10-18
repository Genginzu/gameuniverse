import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * Per-user rate limit for IGDB game imports (issue #376).
 *
 * Backed by the `game_import_events` table so the window survives across
 * serverless invocations — an in-memory counter would reset on every Vercel
 * lambda cold start and never actually limit anything. Admins are exempt and
 * must not reach this module.
 */

export const IMPORT_RATE_LIMIT = 10;
export const IMPORT_RATE_WINDOW_SECONDS = 60 * 60; // 1 hour

export interface RateLimitResult {
  allowed: boolean;
  /** How many imports the user already made in the window. */
  count: number;
  /** Seconds the client should wait before retrying (only when blocked). */
  retryAfterSeconds: number;
}

/**
 * Counts the user's imports in the trailing window and decides whether a new
 * import is allowed. Fails open on a DB error (logs and allows) so a transient
 * database issue never hard-blocks a legitimate user — auth already gates the
 * route, so the worst case is a missed count, not an open door.
 */
export async function checkImportRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("count_recent_game_imports", {
      target_user_id: userId,
      window_seconds: IMPORT_RATE_WINDOW_SECONDS,
    });

    if (error) {
      logger.error("Failed to count recent game imports", { userId, error });
      return { allowed: true, count: 0, retryAfterSeconds: 0 };
    }

    const count = typeof data === "number" ? data : 0;
    const allowed = count < IMPORT_RATE_LIMIT;

    return {
      allowed,
      count,
      retryAfterSeconds: allowed ? 0 : IMPORT_RATE_WINDOW_SECONDS,
    };
  } catch (error) {
    logger.error("Unexpected error checking import rate limit", { userId, error });
    return { allowed: true, count: 0, retryAfterSeconds: 0 };
  }
}

/**
 * Records a successful import so it counts against the user's window.
 * Best-effort: a failure here is logged but does not fail the import, since the
 * game was already created.
 */
export async function recordImportEvent(
  userId: string,
  igdbId: number,
  gameId: string | null
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("game_import_events").insert({
      user_id: userId,
      igdb_id: igdbId,
      game_id: gameId,
    });
    if (error) {
      logger.error("Failed to record game import event", { userId, igdbId, error });
    }
  } catch (error) {
    logger.error("Unexpected error recording game import event", { userId, igdbId, error });
  }
}
