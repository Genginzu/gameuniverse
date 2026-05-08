/**
 * Orchestrates a full IGDB game import or sync.
 * Deno port of src/lib/services/gameImportService.ts.
 *
 * Differences vs the Next.js version:
 *  - Color extraction is removed (Jimp not ported to Edge Functions).
 *  - Returns a minimal { gameId, slug } payload instead of a full
 *    GameDetails — the processor doesn't need the rich object.
 */

import { getSupabaseAdmin } from "./supabase-admin.ts";
import { IGDBService } from "./igdb-service.ts";
import { logger } from "./logger.ts";
import { fetchMetacriticScore } from "./metacritic-service.ts";
import {
  transformIGDBToSupabase,
  transformIGDBToSupabaseUpdate,
} from "./game-import/transform.ts";
import {
  ensurePlatforms,
  ensureRelatedEntities,
  linkCompanies,
  linkGenres,
  linkPlatforms,
  syncPlatforms,
} from "./game-import/entities.ts";
import {
  createMedia,
  createTranslations,
  updateMedia,
  updateTranslations,
} from "./game-import/media.ts";
import { createLanguages, updateLanguages } from "./game-import/languages.ts";
import { createAgeRatings, updateAgeRatings } from "./game-import/age-ratings.ts";
import {
  createDlcExtensions,
  createSimilarGames,
  createVersions,
  updateDlcExtensions,
  updateSimilarGames,
  updateVersions,
} from "./game-import/extras.ts";
import { fetchAndSavePlaytime } from "./game-import/playtime.ts";
import { fetchAndSavePopularity } from "./game-import/popularity.ts";
import type { IGDBGame } from "./igdb-types.ts";

export interface ImportResult {
  success: boolean;
  gameId?: string;
  slug?: string;
  error?: string;
}

export const GameImportService = {
  async importFromIGDB(igdbId: number): Promise<ImportResult> {
    try {
      logger.info("Starting IGDB import", { igdbId });

      const igdbGame = await IGDBService.getGameDetails(igdbId);
      if (!igdbGame) {
        return { success: false, error: `Game with IGDB ID ${igdbId} not found` };
      }

      const supabase = getSupabaseAdmin();

      const { data: existingGame, error: checkError } = await supabase
        .from("games")
        .select("id, slug")
        .eq("igdb_id", igdbId)
        .single();

      // PGRST116 = no rows; expected when the game doesn't exist yet
      if (checkError && checkError.code !== "PGRST116") {
        logger.error("Error checking existing game", { igdbId, error: checkError });
      }

      if (existingGame) {
        logger.info("Game already exists, syncing", {
          slug: existingGame.slug,
          igdbId,
        });
        return await GameImportService.syncWithIGDB(
          existingGame.id as string,
          igdbId,
        );
      }

      const relatedEntities = await ensureRelatedEntities(igdbGame);
      const gameData = transformIGDBToSupabase(igdbGame);

      const { data: newGame, error: gameError } = await supabase
        .from("games")
        .insert(gameData)
        .select("id, slug")
        .single();

      if (gameError || !newGame) {
        logger.error("Failed to insert game", { igdbId, error: gameError });
        return {
          success: false,
          error: `Failed to create game: ${gameError?.message ?? "Unknown error"}`,
        };
      }

      const newGameId = newGame.id as string;
      const newGameSlug = newGame.slug as string;

      await GameImportService.createAllRelatedData(newGameId, igdbGame, relatedEntities);

      // Best-effort Metacritic score
      try {
        const mcScore = await fetchMetacriticScore(newGameSlug);
        if (mcScore !== null) {
          await supabase.from("games").update({ metascore: mcScore }).eq("id", newGameId);
        }
      } catch {
        // ignore — Metacritic is best-effort
      }

      logger.info("IGDB import complete", { slug: newGameSlug, igdbId });
      return { success: true, gameId: newGameId, slug: newGameSlug };
    } catch (error) {
      logger.error("IGDB import failed", { igdbId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during import",
      };
    }
  },

  async syncWithIGDB(gameId: string, igdbId: number): Promise<ImportResult> {
    try {
      const supabase = getSupabaseAdmin();

      const { data: currentGame, error: fetchError } = await supabase
        .from("games")
        .select("id, slug")
        .eq("id", gameId)
        .single();

      if (fetchError || !currentGame) {
        return { success: false, error: `Game with ID ${gameId} not found` };
      }

      const igdbGame = await IGDBService.getGameDetails(igdbId);
      if (!igdbGame) {
        logger.warn("IGDB game not found during sync, preserving existing data", {
          igdbId,
        });
        return { success: false, error: `IGDB game ${igdbId} not found` };
      }

      const updateData = transformIGDBToSupabaseUpdate(igdbGame);
      const { error: updateError } = await supabase
        .from("games")
        .update(updateData)
        .eq("id", gameId);

      if (updateError) {
        logger.error("Failed to update game during sync", { gameId, error: updateError });
        return {
          success: false,
          error: `Failed to update game: ${updateError.message}`,
        };
      }

      await GameImportService.updateAllRelatedData(gameId, igdbGame);

      return {
        success: true,
        gameId,
        slug: currentGame.slug as string,
      };
    } catch (error) {
      logger.error("Game sync with IGDB failed", { gameId, igdbId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during sync",
      };
    }
  },

  async createAllRelatedData(
    gameId: string,
    igdbGame: IGDBGame,
    relatedEntities: { genreIds: string[]; developerIds: string[]; publisherIds: string[] },
  ): Promise<void> {
    await createTranslations(gameId, igdbGame);

    if (relatedEntities.genreIds.length > 0) {
      await linkGenres(gameId, relatedEntities.genreIds);
    }
    if (relatedEntities.developerIds.length > 0) {
      await linkCompanies(gameId, relatedEntities.developerIds, "developer");
    }
    if (relatedEntities.publisherIds.length > 0) {
      await linkCompanies(gameId, relatedEntities.publisherIds, "publisher");
    }

    await createMedia(gameId, igdbGame);
    await createLanguages(gameId, igdbGame);
    await createAgeRatings(gameId, igdbGame);
    await createVersions(gameId, igdbGame.id);
    await createDlcExtensions(gameId, igdbGame);
    await createSimilarGames(gameId, igdbGame);

    const platformIds = await ensurePlatforms(igdbGame);
    if (platformIds.length > 0) {
      await linkPlatforms(gameId, platformIds);
    }

    await fetchAndSavePlaytime(gameId, igdbGame.id);
    await fetchAndSavePopularity(gameId, igdbGame.id);
  },

  async updateAllRelatedData(gameId: string, igdbGame: IGDBGame): Promise<void> {
    await updateTranslations(gameId, igdbGame);
    await updateMedia(gameId, igdbGame);
    await updateLanguages(gameId, igdbGame);
    await updateAgeRatings(gameId, igdbGame);
    await updateVersions(gameId, igdbGame.id);
    await updateDlcExtensions(gameId, igdbGame);
    await updateSimilarGames(gameId, igdbGame);
    await syncPlatforms(gameId, igdbGame);
    await fetchAndSavePlaytime(gameId, igdbGame.id);
    await fetchAndSavePopularity(gameId, igdbGame.id);
  },
};
