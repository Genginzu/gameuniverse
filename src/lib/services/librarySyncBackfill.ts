import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const TITLES_TABLE = "user_platform_titles";
const UPSERT_CHUNK = 200;

export interface ReportedTitle {
  sourceId: string;
  name: string;
}

/**
 * Record every title a user's sync reported (matched or not) so a later match
 * can be backfilled into their library. Best-effort — never throws.
 *
 * `admin` is the service-role (untyped) client.
 */
export async function recordUserPlatformTitles(
  admin: SupabaseClient,
  userId: string,
  platform: string,
  titles: ReportedTitle[]
): Promise<void> {
  if (titles.length === 0) return;
  const now = new Date().toISOString();
  const rows = titles.map((titre) => ({
    user_id: userId,
    platform,
    source_id: titre.sourceId,
    name: titre.name || null,
    updated_at: now,
  }));

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await admin
      .from(TITLES_TABLE)
      .upsert(chunk, { onConflict: "user_id,platform,source_id" });
    if (error) {
      logger.warn("Failed to record user platform titles", { platform, userId, error });
      return;
    }
  }
}

/**
 * Add a freshly-matched game to the library of every user who reported the
 * given platform title. Runs when a match is discovered (auto or admin link)
 * so existing owners get the game without re-syncing. Best-effort — never
 * throws. Returns the number of users backfilled.
 *
 * `admin` is the service-role (untyped) client.
 */
export async function backfillMatch(
  admin: SupabaseClient,
  platform: string,
  sourceId: string,
  gameId: string
): Promise<number> {
  try {
    const { data, error } = await admin
      .from(TITLES_TABLE)
      .select("user_id")
      .eq("platform", platform)
      .eq("source_id", sourceId);
    if (error) {
      logger.warn("Backfill lookup failed", { platform, sourceId, error });
      return 0;
    }

    const userIds = Array.from(
      new Set((data ?? []).map((r) => (r as { user_id: string }).user_id))
    );
    if (userIds.length === 0) return 0;

    const now = new Date().toISOString();
    const rows = userIds.map((userId) => ({
      user_id: userId,
      game_id: gameId,
      status: "owned",
      source_platform: platform,
      source_id: sourceId,
      synced_at: now,
    }));

    const { error: upsertError } = await admin
      .from("user_library")
      .upsert(rows, { onConflict: "user_id,game_id" });
    if (upsertError) {
      logger.warn("Backfill upsert failed", { platform, sourceId, upsertError });
      return 0;
    }
    return userIds.length;
  } catch (err) {
    logger.warn("Backfill threw", { platform, sourceId, err });
    return 0;
  }
}
