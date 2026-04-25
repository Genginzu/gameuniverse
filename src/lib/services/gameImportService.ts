import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBGame } from "@/types/igdb";
import { IGDBService } from "./igdbService";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";
import { logger } from "@/lib/logger";

// Split modules
import type { ImportResult } from "./game-import/types";
import { transformIGDBToSupabase, transformIGDBToSupabaseUpdate } from "./game-import/transform";
import {
  ensureRelatedEntities,
  linkGenres,
  linkCompanies,
  ensurePlatforms,
  linkPlatforms,
  syncPlatforms,
} from "./game-import/entities";
import {
  createMedia,
  updateMedia,
  createTranslations,
  updateTranslations,
} from "./game-import/media";
import { createLanguages, updateLanguages } from "./game-import/languages";
import { createAgeRatings, updateAgeRatings } from "./game-import/age-ratings";
import {
  createVersions,
  updateVersions,
  createDlcExtensions,
  updateDlcExtensions,
  createSimilarGames,
  updateSimilarGames,
} from "./game-import/extras";
import { fetchAndSavePlaytime, fetchGameDetails } from "./game-import/playtime";
import { fetchAndSavePopularity } from "./game-import/popularity";

export type { ImportResult } from "./game-import/types";

/**
 * Service for importing and synchronizing games from IGDB to Supabase.
 * Orchestrates the complete import workflow including related entities.
 */
export class GameImportService {
  /**
   * Imports a new game from IGDB into the local Supabase database.
   */
  static async importFromIGDB(igdbId: number): Promise<ImportResult> {
    try {
      logger.info("Starting IGDB import", { igdbId });

      const igdbGame = await IGDBService.getGameDetails(igdbId);
      if (!igdbGame) {
        return { success: false, error: `Game with IGDB ID ${igdbId} not found` };
      }

      const supabase = await getSupabaseAdmin();

      // Check if game already exists — sync instead of duplicate
      const { data: existingGame, error: checkError } = await supabase
        .from("games")
        .select("id, slug")
        .eq("igdb_id", igdbId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        logger.error("Error checking existing game", { igdbId, error: checkError });
      }

      if (existingGame) {
        logger.info("Game already exists, syncing", { slug: existingGame.slug, igdbId });
        return this.syncWithIGDB(existingGame.id, igdbId);
      }

      // Ensure related entities exist
      const relatedEntities = await ensureRelatedEntities(igdbGame);

      // Transform and extract colors
      const gameData = transformIGDBToSupabase(igdbGame);
      if (gameData.cover_image_url) {
        const colors = await extractColorsFromCover(gameData.cover_image_url);
        if (colors) {
          gameData.background_color = colors.background_color;
          gameData.accent_color = colors.accent_color;
          gameData.label_color = colors.label_color;
          gameData.text_color = colors.text_color;
        }
      }

      // Insert the game
      const { data: newGame, error: gameError } = await supabase
        .from("games")
        .insert(gameData)
        .select("id, slug")
        .single();

      if (gameError || !newGame) {
        logger.error("Failed to insert game", { igdbId, error: gameError });
        return {
          success: false,
          error: `Failed to create game: ${gameError?.message || "Unknown error"}`,
        };
      }

      // Create all related data
      await this.createAllRelatedData(newGame.id, igdbGame, relatedEntities);

      const gameDetails = await fetchGameDetails(newGame.slug);
      logger.info("IGDB import complete", { slug: newGame.slug, igdbId });

      return { success: true, game: gameDetails || undefined };
    } catch (error) {
      logger.error("IGDB import failed", { igdbId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during import",
      };
    }
  }

  /**
   * Synchronizes an existing local game with fresh data from IGDB.
   */
  static async syncWithIGDB(gameId: string, igdbId: number): Promise<ImportResult> {
    try {
      const supabase = await getSupabaseAdmin();

      const { data: currentGame, error: fetchError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (fetchError || !currentGame) {
        return { success: false, error: `Game with ID ${gameId} not found` };
      }

      const igdbGame = await IGDBService.getGameDetails(igdbId);
      if (!igdbGame) {
        logger.warn("IGDB game not found during sync, preserving existing data", { igdbId });
        return { success: false, error: `IGDB game ${igdbId} not found` };
      }

      // Update game core data
      const updateData = transformIGDBToSupabaseUpdate(igdbGame);
      if (updateData.cover_image_url) {
        const colors = await extractColorsFromCover(updateData.cover_image_url, true);
        if (colors) {
          updateData.background_color = colors.background_color;
          updateData.accent_color = colors.accent_color;
          updateData.label_color = colors.label_color;
          updateData.text_color = colors.text_color;
        }
      }

      const { error: updateError } = await supabase
        .from("games")
        .update(updateData)
        .eq("id", gameId);

      if (updateError) {
        logger.error("Failed to update game during sync", { gameId, error: updateError });
        return { success: false, error: `Failed to update game: ${updateError.message}` };
      }

      // Update all related data
      await this.updateAllRelatedData(gameId, igdbGame);

      const gameDetails = await fetchGameDetails(currentGame.slug);
      return { success: true, game: gameDetails || undefined };
    } catch (error) {
      logger.error("Game sync with IGDB failed", { gameId, igdbId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during sync",
      };
    }
  }

  /**
   * Ensures all related entities exist (public — used by sync fields).
   */
  static async ensureRelatedEntities(igdbGame: IGDBGame) {
    return ensureRelatedEntities(igdbGame);
  }

  /**
   * Creates all related data for a newly imported game.
   */
  private static async createAllRelatedData(
    gameId: string,
    igdbGame: IGDBGame,
    relatedEntities: { genreIds: string[]; developerIds: string[]; publisherIds: string[] }
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
  }

  /**
   * Updates all related data for an existing game during sync.
   */
  private static async updateAllRelatedData(gameId: string, igdbGame: IGDBGame): Promise<void> {
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
  }
}
