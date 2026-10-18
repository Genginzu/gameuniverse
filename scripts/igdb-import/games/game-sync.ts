import { createScriptClient } from "../shared/supabase-client";
import { syncAllGameFields, type SyncSupabaseClient } from "../../../src/lib/services/igdb-sync";
import type { ImportResult } from "./game-importer";

export async function syncExistingGame(
  gameId: string,
  gameSlug: string,
  igdbId: number,
  verbose: boolean = false
): Promise<ImportResult> {
  try {
    if (verbose) {
      console.log(`[Importer] Syncing existing game: ${gameSlug} (IGDB ID: ${igdbId})`);
    }

    const syncClient = createScriptClient() as unknown as SyncSupabaseClient;
    const result = await syncAllGameFields(syncClient, gameId, igdbId, "respect-overrides");

    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (verbose) {
      console.log(`[Importer] Synced ${result.syncedFields.length} fields for ${gameSlug}`);
    }

    return { success: true, gameSlug, synced: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during sync",
    };
  }
}
