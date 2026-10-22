/**
 * Backfill `games.is_adult` from IGDB (Erotic theme, id 42).
 * Usage:
 *   bun --env-file=.env scripts/igdb-import/games/backfill-adult.ts [--dry-run]
 *
 * Pages every IGDB game tagged Erotic (500 ids per request, ~4 req/s) and
 * flags the matching local games. The trg_games_hybrid_popularity trigger then
 * forces their trending score to 0. Idempotent: re-running only re-flags.
 */

import { createScriptClient } from "../shared/supabase-client";
import { IGDBService } from "../../../src/lib/services/igdbService";
import { IGDB_EROTIC_THEME_ID } from "../../../src/lib/utils/igdbAdult";
import { RateLimiter } from "../shared/rate-limiter";

const PAGE_SIZE = 500;
const UPDATE_CHUNK = 200;

async function fetchAdultIgdbIds(rateLimiter: RateLimiter): Promise<number[]> {
  const ids: number[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    await rateLimiter.throttle();
    const page = await IGDBService.getGameIdsByTheme(IGDB_EROTIC_THEME_ID, offset, PAGE_SIZE);
    ids.push(...page);
    if (page.length < PAGE_SIZE) return ids;
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabase = createScriptClient();
  const igdbIds = await fetchAdultIgdbIds(new RateLimiter(4, 1000));
  console.log(`[AdultBackfill] ${igdbIds.length} IGDB games tagged Erotic`);

  let flagged = 0;
  for (let i = 0; i < igdbIds.length; i += UPDATE_CHUNK) {
    const chunk = igdbIds.slice(i, i + UPDATE_CHUNK);
    // `is_adult` added by migration 20261022000001, not yet in generated types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from("games") as any;
    const query = dryRun
      ? table.select("id").in("igdb_id", chunk).eq("is_adult", false)
      : table.update({ is_adult: true }).in("igdb_id", chunk).eq("is_adult", false).select("id");
    const { data, error } = await query;
    if (error) {
      console.error("[AdultBackfill] Update error:", error.message);
      process.exit(1);
    }
    flagged += data?.length ?? 0;
  }

  console.log(`[AdultBackfill] ${dryRun ? "Would flag" : "Flagged"} ${flagged} local games`);
}

main().catch((err) => {
  console.error("[AdultBackfill] Fatal:", err);
  process.exit(1);
});
