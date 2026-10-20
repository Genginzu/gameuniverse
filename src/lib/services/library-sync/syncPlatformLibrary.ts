import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import {
  dedupeByGameId,
  resolveLibraryGames,
  type ResolveResult,
} from "@/lib/services/libraryGameResolver";
import { recordUserPlatformTitles } from "@/lib/services/librarySyncBackfill";
import type {
  LibrarySyncAdapter,
  LibrarySyncProgressCallback,
  LibrarySyncResult,
  PlatformLibraryItem,
  SyncablePlatform,
} from "@/types/library-sync";
import { getLibraryAdapter } from "./adapters";

const UPSERT_CHUNK = 200;
const MAX_IGDB_OPS_PER_SYNC = 30;

type LibraryRow = Database["public"]["Tables"]["user_library"]["Insert"];

export interface SyncLibraryOptions {
  onProgress?: LibrarySyncProgressCallback;
  importBudget?: number;
}

export function syncPlatformLibrary(
  supabase: SupabaseClient<Database>,
  userId: string,
  platform: SyncablePlatform,
  options: SyncLibraryOptions = {}
): Promise<LibrarySyncResult> {
  return syncLibraryWithAdapter(supabase, userId, getLibraryAdapter(platform), options);
}

export async function syncLibraryWithAdapter(
  supabase: SupabaseClient<Database>,
  userId: string,
  adapter: LibrarySyncAdapter,
  { onProgress, importBudget = MAX_IGDB_OPS_PER_SYNC }: SyncLibraryOptions = {}
): Promise<LibrarySyncResult> {
  onProgress?.({ phase: "fetching" });
  const { items, privateProfile = false } = await adapter.fetchLibrary(supabase, userId);
  const total = items.length;

  if (total === 0) {
    onProgress?.({ phase: "done", total: 0, processed: 0, matched: 0, privateProfile });
    return emptyResult(privateProfile);
  }

  onProgress?.({ phase: "resolving", total, privateProfile });
  await recordUserPlatformTitles(
    supabase as unknown as SupabaseClient,
    userId,
    adapter.platform,
    items.map(({ sourceId, name }) => ({ sourceId, name }))
  );

  const { resolved, imported, pending } = await resolveItems(
    supabase,
    adapter,
    items,
    importBudget,
    onProgress
  );
  const matched = items.filter((item) => resolved.has(item.sourceId)).length;
  const unmatched = total - matched;

  onProgress?.({ phase: "saving", total, matched, imported });
  const rows = buildLibraryRows(userId, adapter, items, resolved);
  const upserted = await upsertLibraryRows(supabase, adapter.platform, rows, onProgress);

  onProgress?.({
    phase: "done",
    total,
    processed: upserted,
    matched,
    imported,
    unmatched,
    privateProfile,
  });

  return {
    total,
    matched,
    upserted,
    unmatched,
    imported,
    pending,
    done: pending === 0,
    privateProfile,
  };
}

function emptyResult(privateProfile: boolean): LibrarySyncResult {
  return {
    total: 0,
    matched: 0,
    upserted: 0,
    unmatched: 0,
    imported: 0,
    pending: 0,
    done: true,
    privateProfile,
  };
}

async function resolveItems(
  supabase: SupabaseClient<Database>,
  adapter: LibrarySyncAdapter,
  items: PlatformLibraryItem[],
  importBudget: number,
  onProgress?: LibrarySyncProgressCallback
): Promise<ResolveResult> {
  const known = adapter.findKnownGames
    ? await adapter.findKnownGames(supabase, items)
    : new Map<string, string>();
  const remaining = items.filter((item) => !known.has(item.sourceId));

  const result = await resolveLibraryGames(supabase, remaining, adapter.externalCategory, {
    platform: adapter.platform,
    importBudget,
    onProgress,
  });
  for (const [sourceId, gameId] of known) result.resolved.set(sourceId, gameId);
  return result;
}

function buildLibraryRows(
  userId: string,
  adapter: LibrarySyncAdapter,
  items: PlatformLibraryItem[],
  resolved: Map<string, string>
): LibraryRow[] {
  const entries = items.flatMap((item) => {
    const gameId = resolved.get(item.sourceId);
    return gameId ? [{ game_id: gameId, item }] : [];
  });

  const pick = adapter.pickDuplicate;
  const unique = dedupeByGameId(
    entries,
    pick
      ? (existing, candidate) =>
          pick(existing.item, candidate.item) === candidate.item ? candidate : existing
      : undefined
  );

  const now = new Date().toISOString();
  return unique.map(({ game_id, item }) => ({
    user_id: userId,
    game_id,
    status: "owned",
    source_platform: adapter.platform,
    source_id: item.sourceId,
    synced_at: now,
    ...playtimeColumns(item.playtimeMinutes),
  }));
}

function playtimeColumns(minutes: number | undefined): Partial<LibraryRow> {
  if (minutes === undefined) return {};
  return { external_playtime_seconds: minutes * 60, play_time_hours: Math.round(minutes / 60) };
}

async function upsertLibraryRows(
  supabase: SupabaseClient<Database>,
  platform: SyncablePlatform,
  rows: LibraryRow[],
  onProgress?: LibrarySyncProgressCallback
): Promise<number> {
  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error, count } = await supabase
      .from("user_library")
      .upsert(chunk, { onConflict: "user_id,game_id", count: "exact" });
    if (error) {
      logger.error("Failed to upsert user_library chunk", {
        platform,
        error,
        chunkSize: chunk.length,
      });
      throw error;
    }
    upserted += count ?? chunk.length;
    onProgress?.({ processed: upserted });
  }
  return upserted;
}
