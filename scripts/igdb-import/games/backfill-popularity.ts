/**
 * Backfill IGDB popularity primitives for every locally-imported game.
 * Usage:
 *   bunx tsx scripts/igdb-import/games/backfill-popularity.ts [--limit N] [--verbose]
 *
 * Iterates games WHERE igdb_id IS NOT NULL in batches of 100, rate-limited
 * to IGDB's ~4 req/s. Writes igdb_pop_visits / want_to_play / playing /
 * updated_at — the trg_games_hybrid_popularity trigger then recomputes
 * hybrid_popularity_score.
 */

import { createScriptClient } from "../shared/supabase-client";
import { IGDBService } from "../../../src/lib/services/igdbService";
import { RateLimiter } from "../shared/rate-limiter";

interface Args {
  limit: number | null;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { limit: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--verbose" || arg === "-v") args.verbose = true;
    else if (arg === "--limit" && argv[i + 1]) {
      args.limit = Number(argv[++i]);
    }
  }
  return args;
}

async function main() {
  const { limit, verbose } = parseArgs(process.argv.slice(2));
  const supabase = createScriptClient();
  const rateLimiter = new RateLimiter(4, 1000);

  const BATCH = 100;
  let offset = 0;
  let processed = 0;
  let failed = 0;

  for (;;) {
    const pageLimit = limit !== null ? Math.min(BATCH, limit - processed) : BATCH;
    if (pageLimit <= 0) break;

    const { data: rows, error } = await supabase
      .from("games")
      .select("id, igdb_id")
      .not("igdb_id", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageLimit - 1);

    if (error) {
      console.error(`[Backfill] Fetch error at offset ${offset}:`, error.message);
      process.exit(1);
    }
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const igdbId = row.igdb_id as number;
      const gameId = row.id as string;
      await rateLimiter.throttle();

      try {
        const primitives = await IGDBService.getPopularityPrimitives(igdbId);
        // Columns added by migration 20260420000001 but not yet in generated types.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from("games") as any)
          .update({
            igdb_pop_visits: primitives?.visits ?? null,
            igdb_pop_want_to_play: primitives?.wantToPlay ?? null,
            igdb_pop_playing: primitives?.playing ?? null,
            igdb_pop_updated_at: new Date().toISOString(),
          })
          .eq("id", gameId);

        if (updateError) {
          failed++;
          if (verbose) console.error(`[Backfill] ${gameId} update error:`, updateError.message);
        } else {
          processed++;
          if (verbose) {
            console.log(
              `[Backfill] ${gameId} igdbId=${igdbId} visits=${primitives?.visits ?? "-"} want=${primitives?.wantToPlay ?? "-"} playing=${primitives?.playing ?? "-"}`
            );
          }
        }
      } catch (err) {
        failed++;
        if (verbose) console.error(`[Backfill] ${gameId} fetch error:`, err);
      }
    }

    offset += rows.length;
    if (rows.length < pageLimit) break;
  }

  console.log(`[Backfill] Done. processed=${processed} failed=${failed}`);
}

main().catch((err) => {
  console.error("[Backfill] Fatal:", err);
  process.exit(1);
});
