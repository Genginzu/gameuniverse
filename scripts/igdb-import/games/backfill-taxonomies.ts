/**
 * Backfill IGDB themes, game modes, player perspectives and franchises
 * (recommendation features) for every local game never synced.
 *
 * Usage:
 *   bun --env-file=.env scripts/igdb-import/games/backfill-taxonomies.ts [--dry-run] [--limit=N]
 *
 * Pages local games where `igdb_taxonomies_synced_at IS NULL` (500 per IGDB
 * request, ~4 req/s) and writes them through `set_games_taxonomies` (one RPC
 * per page). Idempotent and resumable: synced games leave the queue.
 */

import { createScriptClient } from "../shared/supabase-client";
import { RateLimiter } from "../shared/rate-limiter";
import { withRetry } from "../shared/retry";
import { IGDBService } from "../../../src/lib/services/igdbService";
import {
  saveGameTaxonomies,
  toGameTaxonomies,
  type GameTaxonomiesItem,
  type TaxonomyRpcClient,
} from "../../../src/lib/services/igdbTaxonomies";

const PAGE_SIZE = 500;

interface LocalGame {
  id: string;
  igdb_id: number;
}

function parseLimit(): number {
  const arg = process.argv.find((value) => value.startsWith("--limit="));
  const parsed = arg ? Number.parseInt(arg.split("=")[1], 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.POSITIVE_INFINITY;
}

async function fetchQueuePage(afterId: string | null): Promise<LocalGame[]> {
  // `igdb_taxonomies_synced_at` added by migration 20261024000002, not yet in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (createScriptClient().from("games") as any)
    .select("id, igdb_id")
    .is("igdb_taxonomies_synced_at", null)
    .not("igdb_id", "is", null)
    .order("id")
    .limit(PAGE_SIZE);
  if (afterId) query = query.gt("id", afterId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to read the queue: ${error.message}`);
  return (data ?? []) as LocalGame[];
}

async function buildItems(games: LocalGame[], rateLimiter: RateLimiter): Promise<GameTaxonomiesItem[]> {
  await rateLimiter.throttle();
  const { value: byIgdbId } = await withRetry(() =>
    IGDBService.getTaxonomiesBatch(games.map((game) => game.igdb_id))
  );
  // Games missing on IGDB still get an (empty) write, so they leave the queue.
  return games.map((game) => {
    const igdbGame = byIgdbId.get(game.igdb_id);
    return {
      game_id: game.id,
      taxonomies: igdbGame
        ? toGameTaxonomies(igdbGame)
        : { themes: [], game_modes: [], player_perspectives: [], franchises: [] },
    };
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = parseLimit();
  const rateLimiter = new RateLimiter(4, 1000);
  const supabase = createScriptClient() as unknown as TaxonomyRpcClient;

  let processed = 0;
  let afterId: string | null = null;
  while (processed < limit) {
    const page = (await fetchQueuePage(afterId)).slice(0, limit - processed);
    if (page.length === 0) break;

    const items = await buildItems(page, rateLimiter);
    if (!dryRun) await saveGameTaxonomies(supabase, items);

    processed += page.length;
    // Dry runs never empty the queue: walk it by id instead.
    afterId = dryRun ? page[page.length - 1].id : null;
    console.log(`[TaxonomyBackfill] ${dryRun ? "Would write" : "Wrote"} ${processed} games`);
  }

  console.log(`[TaxonomyBackfill] Done: ${processed} games ${dryRun ? "(dry run)" : ""}`);
}

main().catch((err) => {
  console.error("[TaxonomyBackfill] Fatal:", err);
  process.exit(1);
});
