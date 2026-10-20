import { isTrackableField, TRACKABLE_FIELDS } from "./igdb-fields/registry";
import { syncTrackedFields } from "./igdb-fields/override-aware-sync";
import type { TrackableField } from "@/types/admin-games";

export interface SyncSupabaseClient {
  from: (table: string) => {
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string | number) => Promise<{ error: { message: string } | null }>;
    };
    delete: () => {
      eq: (
        col: string,
        val: string
      ) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        in: (col: string, vals: string[]) => Promise<{ error: { message: string } | null }>;
      };
    };
    insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
      select: (cols?: string) => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
    };
    upsert: (
      data: Record<string, unknown> | Record<string, unknown>[],
      options?: { onConflict: string; ignoreDuplicates?: boolean }
    ) => Promise<{ error: { message: string } | null }>;
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string | number
      ) => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
        eq: (
          col2: string,
          val2: string
        ) => {
          single: () => Promise<{
            data: Record<string, unknown> | null;
            error: { message: string } | null;
          }>;
        };
      };
      in: (
        col: string,
        vals: string[]
      ) => Promise<{
        data: Record<string, unknown>[] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedFields: TrackableField[];
}

export type SyncAllMode = "force" | "respect-overrides";

async function removeOverrides(
  supabase: SyncSupabaseClient,
  gameId: string,
  fields: readonly TrackableField[]
): Promise<void> {
  if (fields.length === 0) return;
  const { error } = await supabase
    .from("game_field_overrides")
    .delete()
    .eq("game_id", gameId)
    .in("field_name", [...fields]);
  if (error) throw new Error(`Failed to remove overrides: ${error.message}`);
}

async function updateLastSyncedAt(supabase: SyncSupabaseClient, gameId: string): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", gameId);
  if (error) throw new Error(`Failed to update last_synced_at: ${error.message}`);
}

function notFound(igdbId: number): SyncResult {
  return { success: false, error: `Game not found in IGDB (id: ${igdbId})`, syncedFields: [] };
}

function failure(error: unknown): SyncResult {
  const message = error instanceof Error ? error.message : "Unknown sync error";
  return { success: false, error: message, syncedFields: [] };
}

export async function syncGameField(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number,
  field: TrackableField
): Promise<SyncResult> {
  if (!isTrackableField(field)) {
    return { success: false, error: `Invalid field: ${field}`, syncedFields: [] };
  }

  try {
    const outcome = await syncTrackedFields(supabase, {
      gameId,
      igdbId,
      fields: [field],
      respectOverrides: false,
    });
    if (outcome.status === "igdb_game_not_found") return notFound(igdbId);

    await removeOverrides(supabase, gameId, [field]);
    await updateLastSyncedAt(supabase, gameId);
    return { success: true, syncedFields: [field] };
  } catch (error) {
    return failure(error);
  }
}

export async function syncAllGameFields(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number,
  mode: SyncAllMode = "force"
): Promise<SyncResult> {
  try {
    const outcome = await syncTrackedFields(supabase, {
      gameId,
      igdbId,
      fields: TRACKABLE_FIELDS,
      respectOverrides: mode === "respect-overrides",
    });
    if (outcome.status === "igdb_game_not_found") return notFound(igdbId);

    if (mode === "force") await removeOverrides(supabase, gameId, TRACKABLE_FIELDS);
    await updateLastSyncedAt(supabase, gameId);
    return { success: true, syncedFields: outcome.syncedFields };
  } catch (error) {
    return failure(error);
  }
}
