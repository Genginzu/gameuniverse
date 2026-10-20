import { IGDBService } from "../igdbService";
import type { SyncSupabaseClient } from "../igdb-sync";
import type { TrackableField } from "@/types/admin-games";
import type { IGDBGame } from "@/types/igdb";
import { isTrackableField } from "./registry";
import { FIELD_SYNC_MAP } from "./sync-map";

export interface TrackedFieldSyncRequest {
  gameId: string;
  igdbId: number;
  fields: readonly TrackableField[];
  respectOverrides: boolean;
  igdbGame?: IGDBGame | null;
}

export type TrackedFieldSyncOutcome =
  | { status: "synced"; syncedFields: TrackableField[]; skippedFields: TrackableField[] }
  | { status: "igdb_game_not_found"; syncedFields: []; skippedFields: TrackableField[] };

interface OverrideRowsReader {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => PromiseLike<{
        data: Array<{ field_name: string }> | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export async function fetchOverriddenFields(
  supabase: SyncSupabaseClient,
  gameId: string
): Promise<Set<TrackableField>> {
  const { data, error } = await (supabase as unknown as OverrideRowsReader)
    .from("game_field_overrides")
    .select("field_name")
    .eq("game_id", gameId);
  if (error) throw new Error(`Failed to fetch field overrides: ${error.message}`);
  return new Set((data ?? []).map((row) => row.field_name).filter(isTrackableField));
}

async function resolveIgdbGame(request: TrackedFieldSyncRequest): Promise<IGDBGame | null> {
  if (request.igdbGame !== undefined) return request.igdbGame;
  return IGDBService.getGameDetails(request.igdbId);
}

export async function syncTrackedFields(
  supabase: SyncSupabaseClient,
  request: TrackedFieldSyncRequest
): Promise<TrackedFieldSyncOutcome> {
  const overridden = request.respectOverrides
    ? await fetchOverriddenFields(supabase, request.gameId)
    : new Set<TrackableField>();
  const fields = [...new Set(request.fields)];
  const skippedFields = fields.filter((field) => overridden.has(field));
  const fieldsToSync = fields.filter((field) => !overridden.has(field));

  const needsIgdbGame = fieldsToSync.some((field) => FIELD_SYNC_MAP[field].source === "igdb-game");
  const igdbGame = needsIgdbGame ? await resolveIgdbGame(request) : null;
  if (needsIgdbGame && !igdbGame) {
    return { status: "igdb_game_not_found", syncedFields: [], skippedFields };
  }

  await Promise.all(
    fieldsToSync.map((field) => {
      const syncer = FIELD_SYNC_MAP[field];
      return syncer.source === "igdb-game"
        ? syncer.run(supabase, request.gameId, igdbGame as IGDBGame)
        : syncer.run(supabase, request.gameId, request.igdbId);
    })
  );

  return { status: "synced", syncedFields: fieldsToSync, skippedFields };
}
