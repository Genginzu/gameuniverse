/**
 * Fonctions de synchronisation IGDB → Supabase (suite).
 * Age ratings, versions, langues et playtime.
 */

import { IGDBService } from "./igdbService";
import { IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS, type IGDBGame } from "@/types/igdb";
import type { SyncSupabaseClient } from "./igdb-sync";
import { untypedTable } from "@/lib/utils/untypedTable";
import { transformIgdbVideos } from "../../../scripts/igdb-import/games/video-transform";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Supprime toutes les lignes d'une table pour un game_id donné */
async function deleteByGameId(
  supabase: SyncSupabaseClient,
  table: string,
  gameId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from(table).delete().eq("game_id", gameId);
  if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
}

/** Synchronise les age ratings */
export async function syncAgeRatings(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_ratings", gameId);
  if (!igdbGame.age_ratings || igdbGame.age_ratings.length === 0) return;

  for (let idx = 0; idx < igdbGame.age_ratings.length; idx++) {
    const ageRating = igdbGame.age_ratings[idx];
    if (ageRating.organization === undefined || ageRating.rating_category === undefined) continue;

    const systemCode = IGDB_RATING_CATEGORIES[ageRating.organization];
    if (!systemCode) continue;

    const ratingInfo = IGDB_ALL_RATINGS[ageRating.rating_category];
    const ratingCode = ratingInfo?.code ?? String(ageRating.rating_category);
    const displayName = ratingInfo?.name ?? `${systemCode} ${ageRating.rating_category}`;
    const minimumAge = ratingInfo?.age ?? null;

    const { data: ratingSystem } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("code", systemCode)
      .single();
    if (!ratingSystem) continue;

    let { data: rating } = await supabase
      .from("ratings")
      .select("id")
      .eq("rating_system_id", ratingSystem.id as string)
      .eq("code", ratingCode)
      .single();

    if (!rating) {
      const { data: newRating } = await supabase
        .from("ratings")
        .insert({
          rating_system_id: ratingSystem.id,
          code: ratingCode,
          display_name: displayName,
          minimum_age: minimumAge,
        })
        .select("id")
        .single();
      if (!newRating) continue;
      rating = newRating;
    }

    await supabase
      .from("game_ratings")
      .insert({
        game_id: gameId,
        rating_id: rating.id,
        is_primary: idx === 0,
      })
      .select("id")
      .single();
  }
}

/** Synchronise les versions (éditions) du jeu */
export async function syncVersions(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number
): Promise<void> {
  const versions = await IGDBService.getGameVersions(igdbId);
  await deleteByGameId(supabase, "game_versions", gameId);

  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    const coverUrl = version.cover?.image_id
      ? IGDBService.buildImageUrl(version.cover.image_id, "cover_big")
      : null;

    await supabase
      .from("game_versions")
      .insert({
        game_id: gameId,
        igdb_id: version.id,
        version_title: version.version_title || version.name,
        description: version.summary || null,
        cover_image_url: coverUrl,
        display_order: i,
      })
      .select("id")
      .single();
  }
}

/** Synchronise les langues supportées */
export async function syncLanguages(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_languages", gameId);
  if (!igdbGame.language_supports || igdbGame.language_supports.length === 0) return;

  // Agréger les supports par langue
  const languageMap = new Map<
    string,
    {
      name: string;
      nativeName: string;
      hasAudio: boolean;
      hasSubtitles: boolean;
      hasInterface: boolean;
    }
  >();

  for (const ls of igdbGame.language_supports) {
    if (!ls.language?.locale) continue;
    const langCode = ls.language.locale.split("-")[0].toLowerCase();
    const existing = languageMap.get(langCode) || {
      name: ls.language.name || langCode,
      nativeName: ls.language.native_name || langCode,
      hasAudio: false,
      hasSubtitles: false,
      hasInterface: false,
    };

    const supportType = ls.language_support_type?.name?.toLowerCase() || "";
    if (supportType.includes("audio")) existing.hasAudio = true;
    else if (supportType.includes("subtitle")) existing.hasSubtitles = true;
    else if (supportType.includes("interface")) existing.hasInterface = true;

    languageMap.set(langCode, existing);
  }

  for (const [code, lang] of languageMap) {
    await supabase
      .from("supported_languages")
      .upsert(
        { code, name: lang.name, native_name: lang.nativeName },
        { onConflict: "code", ignoreDuplicates: true }
      );
    await supabase
      .from("game_languages")
      .insert({
        game_id: gameId,
        language_code: code,
        language_name: lang.name,
        has_audio: lang.hasAudio,
        has_subtitles: lang.hasSubtitles,
        has_interface: lang.hasInterface,
      })
      .select("id")
      .single();
  }
}

/** Synchronise le playtime */
export async function syncPlaytime(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number
): Promise<void> {
  const timeToBeat = await IGDBService.getTimeToBeat(igdbId);

  const secondsToHours = (seconds: number | null | undefined): number | null => {
    if (seconds === null || seconds === undefined || seconds === 0 || isNaN(seconds)) return null;
    const hours = Math.round((seconds / 3600) * 10) / 10;
    return hours > 99999.9 ? null : hours;
  };

  const { error } = await supabase
    .from("games")
    .update({
      playtime_hastily: timeToBeat ? secondsToHours(timeToBeat.hastily) : null,
      playtime_normally: timeToBeat ? secondsToHours(timeToBeat.normally) : null,
      playtime_completely: timeToBeat ? secondsToHours(timeToBeat.completely) : null,
      playtime_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (error) throw new Error(`Failed to sync playtime: ${error.message}`);
}

/**
 * Synchronise le PopScore IGDB — alimente igdb_pop_visits / want_to_play / playing.
 * Le trigger trg_games_hybrid_popularity recalcule hybrid_popularity_score.
 */
export async function syncPopularity(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbId: number
): Promise<void> {
  const primitives = await IGDBService.getPopularityPrimitives(igdbId);

  // Columns added by migration 20260420000001 but not yet in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("games") as any)
    .update({
      igdb_pop_visits: primitives?.visits ?? null,
      igdb_pop_want_to_play: primitives?.wantToPlay ?? null,
      igdb_pop_playing: primitives?.playing ?? null,
      igdb_pop_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (error) throw new Error(`Failed to sync popularity: ${error.message}`);
}

/** Synchronise les vidéos — delete + re-insert depuis les données IGDB */
export async function syncVideos(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_videos", gameId);
  if (!igdbGame.videos || igdbGame.videos.length === 0) return;

  const rows = transformIgdbVideos(igdbGame.videos, gameId);
  for (const row of rows) {
    await supabase
      .from("game_videos")
      .insert({ ...row })
      .select("id")
      .single();
  }
}

/** Synchronise les jeux similaires — delete + re-insert depuis les données IGDB */
export async function syncSimilarGames(
  supabase: SyncSupabaseClient,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await deleteByGameId(supabase, "game_similar_games", gameId);
  if (!igdbGame.similar_games || igdbGame.similar_games.length === 0) return;

  // Resolve local game IDs for similar games that are already imported
  const { data: localGames } = await supabase
    .from("games")
    .select("id, igdb_id")
    .in("igdb_id", igdbGame.similar_games.map(String));

  const localMap = new Map<number, string>();
  for (const g of localGames ?? []) {
    const igdbId = g.igdb_id as number | null;
    if (igdbId !== null) localMap.set(igdbId, g.id as string);
  }

  // Import missing similar games from IGDB
  const missingIds = igdbGame.similar_games.filter((id) => !localMap.has(id));
  const importedNames: string[] = [];

  if (missingIds.length > 0) {
    const { GameImportService } = await import("./gameImportService");
    for (const missingId of missingIds) {
      try {
        const result = await GameImportService.importFromIGDB(missingId);
        if (result.success && result.game) {
          localMap.set(missingId, result.game.id);
          importedNames.push(result.game.title);
        }
      } catch {
        // Non-critical: continue with other similar games
      }
    }
  }

  for (let i = 0; i < igdbGame.similar_games.length; i++) {
    const similarIgdbId = igdbGame.similar_games[i];
    await untypedTable(supabase as unknown as SupabaseClient, "game_similar_games")
      .insert({
        game_id: gameId,
        similar_igdb_id: similarIgdbId,
        similar_game_id: localMap.get(similarIgdbId) ?? null,
        display_order: i,
      })
      .select("id")
      .single();
  }
}
