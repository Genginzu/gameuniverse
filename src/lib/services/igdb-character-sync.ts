/**
 * Service de synchronisation IGDB pour les personnages.
 * Orchestre la synchronisation d'un ou tous les champs d'un personnage depuis IGDB,
 * en respectant les overrides manuels existants.
 *
 * Calqué sur igdb-sync.ts pour les jeux.
 */

import type { CharacterTrackableField } from "@/types/admin-characters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CHARACTER_TRACKABLE_FIELDS: CharacterTrackableField[] = [
  "translations",
  "main_image",
  "gender",
  "species",
  "games",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal Supabase client interface for sync operations */
export interface CharacterSyncSupabaseClient {
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
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string | number
      ) => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export interface CharacterSyncResult {
  success: boolean;
  error?: string;
  syncedFields: CharacterTrackableField[];
}

// ---------------------------------------------------------------------------
// Field sync map — each field maps to a sync function
// ---------------------------------------------------------------------------

type CharacterFieldSyncFn = (
  supabase: CharacterSyncSupabaseClient,
  characterId: string,
  igdbId: number
) => Promise<void>;

/**
 * Placeholder sync functions per field.
 * Each function would fetch from IGDB and update the local DB.
 * For now they perform a no-op update to mark the field as synced.
 */
const FIELD_SYNC_MAP: Record<CharacterTrackableField, CharacterFieldSyncFn> = {
  translations: async (supabase, characterId) => {
    await supabase
      .from("characters")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", characterId);
  },
  main_image: async (supabase, characterId) => {
    await supabase
      .from("characters")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", characterId);
  },
  gender: async (supabase, characterId) => {
    await supabase
      .from("characters")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", characterId);
  },
  species: async (supabase, characterId) => {
    await supabase
      .from("characters")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", characterId);
  },
  games: async (supabase, characterId) => {
    await supabase
      .from("characters")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", characterId);
  },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function removeOverride(
  supabase: CharacterSyncSupabaseClient,
  characterId: string,
  field: CharacterTrackableField
): Promise<void> {
  const { error } = await supabase
    .from("character_field_overrides")
    .delete()
    .eq("character_id", characterId)
    .eq("field_name", field);
  if (error) throw new Error(`Failed to remove override for ${field}: ${error.message}`);
}

async function removeOverrides(
  supabase: CharacterSyncSupabaseClient,
  characterId: string,
  fields: CharacterTrackableField[]
): Promise<void> {
  if (fields.length === 0) return;
  const { error } = await supabase
    .from("character_field_overrides")
    .delete()
    .eq("character_id", characterId)
    .in("field_name", fields);
  if (error) throw new Error(`Failed to remove overrides: ${error.message}`);
}

async function updateLastSyncedAt(
  supabase: CharacterSyncSupabaseClient,
  characterId: string
): Promise<void> {
  const { error } = await supabase
    .from("characters")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", characterId);
  if (error) throw new Error(`Failed to update last_synced_at: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sync a single character field from IGDB.
 * Fetches IGDB data, updates the DB, and removes the override.
 */
export async function syncCharacterField(
  supabase: CharacterSyncSupabaseClient,
  characterId: string,
  igdbId: number,
  field: CharacterTrackableField
): Promise<CharacterSyncResult> {
  if (!CHARACTER_TRACKABLE_FIELDS.includes(field)) {
    return { success: false, error: `Invalid field: ${field}`, syncedFields: [] };
  }

  try {
    await FIELD_SYNC_MAP[field](supabase, characterId, igdbId);
    await removeOverride(supabase, characterId, field);
    await updateLastSyncedAt(supabase, characterId);

    return { success: true, syncedFields: [field] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    return { success: false, error: message, syncedFields: [] };
  }
}

/**
 * Sync all character fields from IGDB.
 * If `overriddenFields` is provided, those fields are skipped (protected).
 * If absent, all fields are synced and all overrides are removed (forced sync).
 */
export async function syncAllCharacterFields(
  supabase: CharacterSyncSupabaseClient,
  characterId: string,
  igdbId: number,
  overriddenFields?: CharacterTrackableField[]
): Promise<CharacterSyncResult> {
  try {
    const overrideSet = new Set(overriddenFields ?? []);
    const fieldsToSync = CHARACTER_TRACKABLE_FIELDS.filter((f) => !overrideSet.has(f));

    for (const field of fieldsToSync) {
      await FIELD_SYNC_MAP[field](supabase, characterId, igdbId);
    }

    // Forced sync (no overriddenFields) → remove all overrides
    if (!overriddenFields) {
      await removeOverrides(supabase, characterId, [...CHARACTER_TRACKABLE_FIELDS]);
    }

    await updateLastSyncedAt(supabase, characterId);

    return { success: true, syncedFields: [...fieldsToSync] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    return { success: false, error: message, syncedFields: [] };
  }
}
