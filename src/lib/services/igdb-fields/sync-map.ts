import { fetchMetacriticScore } from "../metacriticService";
import type { SyncSupabaseClient } from "../igdb-sync";
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
  syncPopularity,
  syncVideos,
  syncSimilarGames,
} from "../igdb-sync-fields";
import { syncTaxonomies } from "../igdbTaxonomies";

export type FieldSyncer =
  | {
      source: "igdb-game";
      run: (supabase: SyncSupabaseClient, gameId: string, igdbGame: IGDBGame) => Promise<void>;
    }
  | {
      source: "igdb-id";
      run: (supabase: SyncSupabaseClient, gameId: string, igdbId: number) => Promise<void>;
    };

function fromGame(
  run: (supabase: SyncSupabaseClient, gameId: string, igdbGame: IGDBGame) => Promise<void>
): FieldSyncer {
  return { source: "igdb-game", run };
}

function fromIgdbId(
  run: (supabase: SyncSupabaseClient, gameId: string, igdbId: number) => Promise<void>
): FieldSyncer {
  return { source: "igdb-id", run };
}

export async function syncMetascoreFromMetacritic(
  supabase: SyncSupabaseClient,
  gameId: string
): Promise<void> {
  const { data: game } = await supabase.from("games").select("slug").eq("id", gameId).single();
  if (!game?.slug) return;
  const score = await fetchMetacriticScore(game.slug as string);
  if (score === null) return;
  const { error } = await supabase.from("games").update({ metascore: score }).eq("id", gameId);
  if (error) throw new Error(`Failed to sync metascore: ${error.message}`);
}

export const FIELD_SYNC_MAP: Readonly<Record<TrackableField, FieldSyncer>> = {
  translations: fromGame(syncTranslations),
  cover_image: fromGame((s, id, game) => syncDirectFields(s, id, game, ["cover_image"])),
  background_image: fromGame((s, id, game) => syncDirectFields(s, id, game, ["background_image"])),
  release_date: fromGame((s, id, game) => syncDirectFields(s, id, game, ["release_date"])),
  metascore: fromIgdbId((s, id) => syncMetascoreFromMetacritic(s, id)),
  genres: fromGame(syncGenres),
  companies: fromGame(syncCompanies),
  platforms: fromGame(syncPlatforms),
  screenshots: fromGame(syncScreenshots),
  artworks: fromGame(syncArtworks),
  age_ratings: fromGame(syncAgeRatings),
  versions: fromIgdbId(syncVersions),
  languages: fromGame(syncLanguages),
  playtime: fromIgdbId(syncPlaytime),
  popularity: fromIgdbId(syncPopularity),
  videos: fromGame(syncVideos),
  similar_games: fromGame(syncSimilarGames),
  taxonomies: fromGame(syncTaxonomies),
};
