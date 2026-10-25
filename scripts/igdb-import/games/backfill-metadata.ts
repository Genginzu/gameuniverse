/**
 * Backfill the IGDB metadata of every local game with at least one field never
 * synced: themes, game modes, player perspectives, multiplayer modes,
 * franchises and series, keywords, engines, websites, total rating.
 *
 * Usage:
 *   bun --env-file=.env scripts/igdb-import/games/backfill-metadata.ts [--dry-run] [--limit=N]
 *
 * Pages local games where one `igdb_*_synced_at` column is NULL (250 per IGDB
 * request, ~4 req/s) and writes every field through `set_games_metadata` (one
 * RPC per page). Idempotent and resumable: synced games leave the queue.
 * Overridden fields (manual admin edits) are left untouched.
 *
 * Also the follow-up of a dump import (`orchestrator.ts --dump`), which does
 * not assemble these fields.
 */

import { createScriptClient } from "../shared/supabase-client";
import { RateLimiter } from "../shared/rate-limiter";
import { withRetry } from "../shared/retry";
import { IGDBService } from "../../../src/lib/services/igdbService";
import {
  METADATA_FIELDS,
  saveGameMetadata,
  toGameMetadata,
  type GameMetadataItem,
  type MetadataField,
  type MetadataRpcClient,
} from "../../../src/lib/services/igdbMetadata";
import type { IGDBGame } from "../../../src/types/igdb";

const PAGE_SIZE = 250;

const SYNCED_COLUMNS: Record<MetadataField, string> = {
  themes: "igdb_themes_synced_at",
  game_modes: "igdb_game_modes_synced_at",
  player_perspectives: "igdb_player_perspectives_synced_at",
  multiplayer_modes: "igdb_multiplayer_modes_synced_at",
  franchises: "igdb_franchises_synced_at",
  keywords: "igdb_keywords_synced_at",
  game_engines: "igdb_game_engines_synced_at",
  websites: "igdb_websites_synced_at",
  igdb_rating: "igdb_rating_synced_at",
};

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
  const anyFieldMissing = Object.values(SYNCED_COLUMNS)
    .map((column) => `${column}.is.null`)
    .join(",");
  // Columns added by migration 20261026000001, not yet in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (createScriptClient().from("games") as any)
    .select("id, igdb_id")
    .or(anyFieldMissing)
    .not("igdb_id", "is", null)
    .order("id")
    .limit(PAGE_SIZE);
  if (afterId) query = query.gt("id", afterId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to read the queue: ${error.message}`);
  return (data ?? []) as LocalGame[];
}

/** Overridden fields per game: manual admin edits must survive the backfill. */
async function fetchOverrides(gameIds: string[]): Promise<Map<string, Set<string>>> {
  const { data, error } = await createScriptClient()
    .from("game_field_overrides")
    .select("game_id, field_name")
    .in("game_id", gameIds);
  if (error) throw new Error(`Failed to read overrides: ${error.message}`);
  const byGame = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const fields = byGame.get(row.game_id) ?? new Set<string>();
    fields.add(row.field_name);
    byGame.set(row.game_id, fields);
  }
  return byGame;
}

async function buildItems(games: LocalGame[], rateLimiter: RateLimiter): Promise<GameMetadataItem[]> {
  await rateLimiter.throttle();
  const { value: byIgdbId } = await withRetry(() =>
    IGDBService.getMetadataBatch(games.map((game) => game.igdb_id))
  );
  const overrides = await fetchOverrides(games.map((game) => game.id));
  // Games missing on IGDB still get an (empty) write, so they leave the queue.
  const empty = { id: 0, name: "", slug: "" } as IGDBGame;
  return games.map((game) => {
    const skipped = overrides.get(game.id) ?? new Set<string>();
    const fields = METADATA_FIELDS.filter((field) => !skipped.has(field));
    return {
      game_id: game.id,
      metadata: toGameMetadata(byIgdbId.get(game.igdb_id) ?? empty, fields),
    };
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = parseLimit();
  const rateLimiter = new RateLimiter(4, 1000);
  const supabase = createScriptClient() as unknown as MetadataRpcClient;

  let processed = 0;
  let afterId: string | null = null;
  while (processed < limit) {
    const page = (await fetchQueuePage(afterId)).slice(0, limit - processed);
    if (page.length === 0) break;

    const items = await buildItems(page, rateLimiter);
    if (!dryRun) await saveGameMetadata(supabase, items);

    processed += page.length;
    // Dry runs never empty the queue; overridden fields stay NULL forever,
    // so the queue is always walked by id.
    afterId = page[page.length - 1].id;
    console.log(`[MetadataBackfill] ${dryRun ? "Would write" : "Wrote"} ${processed} games`);
  }

  console.log(`[MetadataBackfill] Done: ${processed} games ${dryRun ? "(dry run)" : ""}`);
}

main().catch((err) => {
  console.error("[MetadataBackfill] Fatal:", err);
  process.exit(1);
});
