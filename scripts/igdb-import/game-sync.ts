/**
 * Synchronisation d'un jeu existant depuis IGDB.
 * Respecte les overrides manuels enregistrés dans game_field_overrides.
 */

import { createScriptClient } from "./supabase-client";
import { syncAllGameFields, type SyncSupabaseClient } from "../../src/lib/services/igdb-sync";
import type { TrackableField } from "../../src/types/admin-games";
import type { ImportResult } from "./game-importer";

/**
 * Synchronise un jeu existant depuis IGDB en respectant les overrides manuels.
 * Consulte `game_field_overrides` pour déterminer quels champs sont protégés,
 * puis délègue à `syncAllGameFields` pour la mise à jour sélective.
 */
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

    const supabase = createScriptClient();
    // Cast to SyncSupabaseClient – the full SupabaseClient is structurally
    // compatible but its deep generics cause "excessively deep" TS errors.
    const syncClient = supabase as unknown as SyncSupabaseClient;

    // Fetch overridden fields from game_field_overrides
    const { data: overrides, error: overridesError } = await supabase
      .from("game_field_overrides")
      .select("field_name")
      .eq("game_id", gameId);

    if (overridesError) {
      return {
        success: false,
        error: `Failed to fetch overrides: ${overridesError.message}`,
      };
    }

    const overriddenFields = (overrides ?? []).map(
      (o: { field_name: string }) => o.field_name as TrackableField
    );

    if (verbose && overriddenFields.length > 0) {
      console.log(`[Importer] Protected fields (overrides): ${overriddenFields.join(", ")}`);
    }

    // Delegate to syncAllGameFields which handles selective sync + last_synced_at
    const result = await syncAllGameFields(syncClient, gameId, igdbId, overriddenFields);

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
