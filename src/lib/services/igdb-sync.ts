/**
 * Service de synchronisation IGDB.
 * Orchestre la synchronisation d'un ou tous les champs d'un jeu depuis IGDB,
 * en respectant les overrides manuels existants.
 */

import { IGDBService } from "./igdbService";
import { TRACKABLE_FIELDS } from "@/lib/utils/field-tracking";
import type { TrackableField } from "@/types/admin-games";
import type { IGDBGame } from "@/types/igdb";
import {
  syncDirectFields,
  syncTranslations,
  syncGenres,
  syncCompanies,
  syncPlatforms,
  syncScreenshots,
  syncArtworks,
  syncAgeRatings,
  syncVersions,
  syncLanguages,
  syncPlaytime,
  syncVideos,
} from "./igdb-sync-fields";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Interface minimale du client Supabase pour le typage sans dépendance directe */
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

// ---------------------------------------------------------------------------
// Mapping champ → fonction de synchronisation
// ---------------------------------------------------------------------------

type FieldSyncFn = (
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame,
  igdbId: number
) => Promise<void>;

const FIELD_SYNC_MAP: Record<TrackableField, FieldSyncFn> = {
  translations: (s, gid, game) => syncTranslations(s, gid, game),
  cover_image: (s, gid, game) => syncDirectFields(s, gid, game, ["cover_image"]),
  background_image: (s, gid, game) => syncDirectFields(s, gid, game, ["background_image"]),
  release_date: (s, gid, game) => syncDirectFields(s, gid, game, ["release_date"]),
  metascore: (s, gid, game) => syncDirectFields(s, gid, game, ["metascore"]),
  genres: (s, gid, game) => syncGenres(s, gid, game),
  companies: (s, gid, game) => syncCompanies(s, gid, game),
  platforms: (s, gid, game) => syncPlatforms(s, gid, game),
  screenshots: (s, gid, game) => syncScreenshots(s, gid, game),
  artworks: (s, gid, game) => syncArtworks(s, gid, game),
  age_ratings: (s, gid, game) => syncAgeRatings(s, gid, game),
  versions: (s, gid, _game, igdbId) => syncVersions(s, gid, igdbId),
  languages: (s, gid, game) => syncLanguages(s, gid, game),
  playtime: (s, gid, _game, igdbId) => syncPlaytime(s, gid, igdbId),
  videos: (s, gid, game) => syncVideos(s, gid, game),
};

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

async function removeOverride(
  supabase: SyncSupabaseClient,
  gameId: string,
  field: TrackableField
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("game_field_overrides")
    .delete()
    .eq("game_id", gameId)
    .eq("field_name", field);
  if (error) throw new Error(`Failed to remove override for ${field}: ${error.message}`);
}

async function removeOverrides(
  supabase: SyncSupabaseClient,
  gameId: string,
  fields: TrackableField[]
): Promise<void> {
  if (fields.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("game_field_overrides")
    .delete()
    .eq("game_id", gameId)
    .in("field_name", fields);
  if (error) throw new Error(`Failed to remove overrides: ${error.message}`);
}

async function updateLastSyncedAt(supabase: SyncSupabaseClient, gameId: string): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", gameId);
  if (error) throw new Error(`Failed to update last_synced_at: ${error.message}`);
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Synchronise un champ spécifique depuis IGDB.
 * Récupère la donnée IGDB, met à jour la DB et supprime l'override.
 */
export async function syncGameField(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number,
  field: TrackableField
): Promise<SyncResult> {
  if (!TRACKABLE_FIELDS.includes(field)) {
    return { success: false, error: `Invalid field: ${field}`, syncedFields: [] };
  }

  try {
    const igdbGame = await IGDBService.getGameDetails(igdbId);
    if (!igdbGame) {
      return {
        success: false,
        error: `Game not found in IGDB (id: ${igdbId})`,
        syncedFields: [],
      };
    }

    await FIELD_SYNC_MAP[field](supabase, gameId, igdbGame, igdbId);
    await removeOverride(supabase, gameId, field);
    await updateLastSyncedAt(supabase, gameId);

    return { success: true, syncedFields: [field] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    return { success: false, error: message, syncedFields: [] };
  }
}

/**
 * Synchronise tous les champs depuis IGDB.
 * Si `overriddenFields` est fourni, ces champs sont ignorés (protégés).
 * Si `overriddenFields` est absent, tous les champs sont synchronisés
 * et tous les overrides sont supprimés (sync forcée).
 */
export async function syncAllGameFields(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number,
  overriddenFields?: TrackableField[]
): Promise<SyncResult> {
  try {
    const igdbGame = await IGDBService.getGameDetails(igdbId);
    if (!igdbGame) {
      return {
        success: false,
        error: `Game not found in IGDB (id: ${igdbId})`,
        syncedFields: [],
      };
    }

    const overrideSet = new Set(overriddenFields ?? []);
    const fieldsToSync = TRACKABLE_FIELDS.filter((f) => !overrideSet.has(f));

    for (const field of fieldsToSync) {
      await FIELD_SYNC_MAP[field](supabase, gameId, igdbGame, igdbId);
    }

    // En sync forcée (pas d'overriddenFields), supprimer tous les overrides
    if (!overriddenFields) {
      await removeOverrides(supabase, gameId, [...TRACKABLE_FIELDS]);
    }

    await updateLastSyncedAt(supabase, gameId);

    return { success: true, syncedFields: [...fieldsToSync] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    return { success: false, error: message, syncedFields: [] };
  }
}
