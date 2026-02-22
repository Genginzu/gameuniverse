import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBGame, IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS } from "@/types/igdb";
import { GameDetails } from "@/types/game";
import { IGDBService } from "./igdbService";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";
import {
  collectDlcExtensionIds,
  transformIgdbToDlcExtensionRow,
} from "@/lib/utils/dlcExtensionUtils";
import { logger } from "@/lib/logger";

/**
 * Result of an import or sync operation
 */
export interface ImportResult {
  success: boolean;
  game?: GameDetails;
  error?: string;
}

/**
 * Data structure for inserting a new game into Supabase
 */
interface GameInsertData {
  slug: string;
  igdb_id: number;
  release_date: string | null;
  metascore: number | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  label_color: string | null;
  text_color: string | null;
  last_synced_at: string;
  playtime_hastily: number | null;
  playtime_normally: number | null;
  playtime_completely: number | null;
  playtime_updated_at: string | null;
}

/**
 * Related entities extracted from IGDB data
 */
interface RelatedEntities {
  genreIds: string[];
  developerIds: string[];
  publisherIds: string[];
}

/**
 * Service for importing and synchronizing games from IGDB to Supabase
 * Handles the complete import workflow including related entities
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 4.2, 4.3, 4.4
 */
export class GameImportService {
  /**
   * Imports a new game from IGDB into the local Supabase database
   * Creates the game with all available data including translations and related entities
   *
   * @param igdbId The IGDB game ID to import
   * @returns ImportResult with the created game or error
   *
   * Requirements: 5.1, 5.2
   */
  static async importFromIGDB(igdbId: number): Promise<ImportResult> {
    try {
      logger.info("Starting IGDB import", { igdbId });

      // Fetch complete game details from IGDB
      const igdbGame = await IGDBService.getGameDetails(igdbId);

      if (!igdbGame) {
        return {
          success: false,
          error: `Game with IGDB ID ${igdbId} not found`,
        };
      }

      const supabase = await createRouteHandlerClient();

      // Check if game already exists with this IGDB ID
      const { data: existingGame, error: checkError } = await supabase
        .from("games")
        .select("id, slug")
        .eq("igdb_id", igdbId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        logger.error("Error checking existing game", { igdbId, error: checkError });
      }

      // If game exists, sync it instead of returning an error
      if (existingGame) {
        logger.info("Game already exists, syncing", { slug: existingGame.slug, igdbId });
        return this.syncWithIGDB(existingGame.id, igdbId);
      }

      // Ensure related entities exist (genres, companies)
      const relatedEntities = await this.ensureRelatedEntities(igdbGame);

      // Transform IGDB data to Supabase format
      const gameData = this.transformIGDBToSupabase(igdbGame);

      // Extract colors from cover image to match the game's visual identity
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

      // Create translations (FR and EN)
      await this.createTranslations(newGame.id, igdbGame);

      // Link genres
      if (relatedEntities.genreIds.length > 0) {
        await this.linkGenres(newGame.id, relatedEntities.genreIds);
      }

      // Link companies (developers and publishers)
      if (relatedEntities.developerIds.length > 0) {
        await this.linkCompanies(newGame.id, relatedEntities.developerIds, "developer");
      }
      if (relatedEntities.publisherIds.length > 0) {
        await this.linkCompanies(newGame.id, relatedEntities.publisherIds, "publisher");
      }

      // Create media entries (screenshots, artwork)
      await this.createMedia(newGame.id, igdbGame);

      // Create language support entries
      await this.createLanguages(newGame.id, igdbGame);

      // Create age ratings from IGDB
      await this.createAgeRatings(newGame.id, igdbGame);

      // Create game versions (editions)
      await this.createVersions(newGame.id, igdbGame.id);

      // Create DLC and extensions
      await this.createDlcExtensions(newGame.id, igdbGame);

      // Fetch and save playtime from IGDB
      await this.fetchAndSavePlaytime(newGame.id, igdbGame.id);

      // Fetch the complete game details to return
      const gameDetails = await this.fetchGameDetails(newGame.slug);

      logger.info("IGDB import complete", { slug: newGame.slug, igdbId });

      return {
        success: true,
        game: gameDetails || undefined,
      };
    } catch (error) {
      logger.error("IGDB import failed", { igdbId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during import",
      };
    }
  }

  /**
   * Synchronizes an existing local game with fresh data from IGDB
   * Preserves existing data in case of errors
   *
   * @param gameId The local game UUID
   * @param igdbId The IGDB game ID
   * @returns ImportResult with the updated game or error
   *
   * Requirements: 4.2, 4.3, 4.4
   */
  static async syncWithIGDB(gameId: string, igdbId: number): Promise<ImportResult> {
    try {
      const supabase = await createRouteHandlerClient();

      // Fetch current game data for potential rollback
      const { data: currentGame, error: fetchError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (fetchError || !currentGame) {
        return {
          success: false,
          error: `Game with ID ${gameId} not found`,
        };
      }

      // Fetch fresh data from IGDB
      const igdbGame = await IGDBService.getGameDetails(igdbId);

      if (!igdbGame) {
        // IGDB game not found - preserve existing data (Requirement 4.4)
        logger.warn("IGDB game not found during sync, preserving existing data", { igdbId });
        return {
          success: false,
          error: `IGDB game ${igdbId} not found`,
        };
      }

      // Update game with fresh IGDB data
      const updateData = this.transformIGDBToSupabaseUpdate(igdbGame);

      // Extract colors from cover image during sync too
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
        // Update failed - existing data is preserved (Requirement 4.4)
        logger.error("Failed to update game during sync", { gameId, error: updateError });
        return {
          success: false,
          error: `Failed to update game: ${updateError.message}`,
        };
      }

      // Update translations
      await this.updateTranslations(gameId, igdbGame);

      // Update media (screenshots, artwork)
      await this.updateMedia(gameId, igdbGame);

      // Update language support
      await this.updateLanguages(gameId, igdbGame);

      // Update age ratings
      await this.updateAgeRatings(gameId, igdbGame);

      // Update game versions (editions)
      await this.updateVersions(gameId, igdbGame.id);

      // Update DLC and extensions
      await this.updateDlcExtensions(gameId, igdbGame);

      // Update playtime from IGDB
      await this.fetchAndSavePlaytime(gameId, igdbGame.id);

      // Fetch updated game details
      const gameDetails = await this.fetchGameDetails(currentGame.slug);

      return {
        success: true,
        game: gameDetails || undefined,
      };
    } catch (error) {
      // Any error preserves existing data (Requirement 4.4)
      logger.error("Game sync with IGDB failed", { gameId, igdbId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during sync",
      };
    }
  }

  /**
   * Transforms IGDB game data to Supabase insert format
   *
   * @param igdbGame The IGDB game data
   * @returns Data ready for Supabase insert
   */
  private static transformIGDBToSupabase(igdbGame: IGDBGame): GameInsertData {
    // Build cover image URL
    const coverUrl = igdbGame.cover?.image_id
      ? IGDBService.buildImageUrl(igdbGame.cover.image_id, "cover_big")
      : null;

    // Build background image URL from first artwork or screenshot
    let backgroundUrl: string | null = null;
    if (igdbGame.artworks && igdbGame.artworks.length > 0) {
      backgroundUrl = IGDBService.buildImageUrl(igdbGame.artworks[0].image_id, "1080p");
    } else if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
      backgroundUrl = IGDBService.buildImageUrl(igdbGame.screenshots[0].image_id, "1080p");
    }

    // Convert Unix timestamp to ISO date
    const releaseDate = igdbGame.first_release_date
      ? new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0]
      : null;

    // Round aggregated rating to integer for metascore
    const metascore = igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null;

    return {
      slug: igdbGame.slug,
      igdb_id: igdbGame.id,
      release_date: releaseDate,
      metascore,
      cover_image_url: coverUrl,
      background_image_url: backgroundUrl,
      background_color: null,
      accent_color: null,
      label_color: null,
      text_color: null,
      last_synced_at: new Date().toISOString(),
      playtime_hastily: null,
      playtime_normally: null,
      playtime_completely: null,
      playtime_updated_at: null,
    };
  }

  /**
   * Fetches and saves playtime data from IGDB
   *
   * @param gameId The game UUID
   * @param igdbId The IGDB game ID
   */
  private static async fetchAndSavePlaytime(gameId: string, igdbId: number): Promise<void> {
    try {
      const timeToBeat = await IGDBService.getTimeToBeat(igdbId);

      if (!timeToBeat) {
        return;
      }

      // Convert seconds to hours
      const secondsToHours = (seconds: number | null | undefined): number | null => {
        if (seconds === null || seconds === undefined || seconds === 0 || isNaN(seconds))
          return null;
        return Math.round((seconds / 3600) * 10) / 10; // Round to 1 decimal
      };

      const hastily = secondsToHours(timeToBeat.hastily);
      const normally = secondsToHours(timeToBeat.normally);
      const completely = secondsToHours(timeToBeat.completely);

      // Skip if all values are null
      if (hastily === null && normally === null && completely === null) {
        return;
      }

      const supabase = await createRouteHandlerClient();

      const { data, error } = await supabase
        .from("games")
        .update({
          playtime_hastily: hastily,
          playtime_normally: normally,
          playtime_completely: completely,
          playtime_updated_at: new Date().toISOString(),
        })
        .eq("id", gameId)
        .select("id, playtime_hastily, playtime_normally, playtime_completely");

      if (error) {
        logger.error("Failed to save playtime", { gameId, igdbId, error });
      } else if (!data || data.length === 0) {
        logger.error("No rows updated for playtime — possible RLS issue", { gameId });
      }
    } catch (error) {
      logger.error("Error fetching playtime from IGDB", { igdbId, error });
    }
  }

  /**
   * Transforms IGDB game data to Supabase update format
   * Only includes fields that should be updated during sync
   *
   * @param igdbGame The IGDB game data
   * @returns Data ready for Supabase update
   */
  private static transformIGDBToSupabaseUpdate(igdbGame: IGDBGame): Partial<GameInsertData> {
    const baseData = this.transformIGDBToSupabase(igdbGame);

    // For updates, we don't change the slug or igdb_id
    // Colors are set separately in syncWithIGDB after extraction
    return {
      release_date: baseData.release_date,
      metascore: baseData.metascore,
      cover_image_url: baseData.cover_image_url,
      background_image_url: baseData.background_image_url,
      background_color: baseData.background_color,
      accent_color: baseData.accent_color,
      label_color: baseData.label_color,
      text_color: baseData.text_color,
      last_synced_at: baseData.last_synced_at,
    };
  }

  /**
   * Ensures all related entities (genres, companies) exist in the database
   * Creates missing entities or returns IDs of existing ones
   *
   * @param igdbGame The IGDB game data
   * @returns IDs of related entities
   *
   * Requirements: 5.3, 5.4
   */
  static async ensureRelatedEntities(igdbGame: IGDBGame): Promise<RelatedEntities> {
    const genreIds = await this.ensureGenres(igdbGame.genres || []);
    const { developerIds, publisherIds } = await this.ensureCompanies(
      igdbGame.involved_companies || []
    );

    return {
      genreIds,
      developerIds,
      publisherIds,
    };
  }

  /**
   * Ensures genres exist in the database, creating them if necessary
   *
   * @param igdbGenres Array of IGDB genres
   * @returns Array of genre UUIDs
   */
  private static async ensureGenres(
    igdbGenres: Array<{ id: number; name: string; slug: string }>
  ): Promise<string[]> {
    if (igdbGenres.length === 0) return [];

    const supabase = await createRouteHandlerClient();
    const genreIds: string[] = [];

    for (const igdbGenre of igdbGenres) {
      // Check if genre exists by slug
      const { data: existingGenre } = await supabase
        .from("genres")
        .select("id")
        .eq("slug", igdbGenre.slug)
        .single();

      if (existingGenre) {
        genreIds.push(existingGenre.id);
      } else {
        // Create new genre
        const { data: newGenre, error } = await supabase
          .from("genres")
          .insert({ slug: igdbGenre.slug })
          .select("id")
          .single();

        if (newGenre && !error) {
          genreIds.push(newGenre.id);

          // Create translations for the genre
          await this.createGenreTranslations(newGenre.id, igdbGenre.name);
        }
      }
    }

    return genreIds;
  }

  /**
   * Creates translations for a genre (EN and FR)
   *
   * @param genreId The genre UUID
   * @param name The genre name from IGDB (English)
   */
  private static async createGenreTranslations(genreId: string, name: string): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Only create English translation — IGDB data is English only
    await supabase.from("genre_translations").insert({
      genre_id: genreId,
      language_code: "en",
      name: name,
    });
  }

  /**
   * Ensures companies exist in the database, creating them if necessary
   *
   * @param involvedCompanies Array of IGDB involved companies
   * @returns Object with developer and publisher UUIDs
   */
  private static async ensureCompanies(
    involvedCompanies: Array<{
      company: { id: number; name: string; slug: string };
      developer: boolean;
      publisher: boolean;
    }>
  ): Promise<{ developerIds: string[]; publisherIds: string[] }> {
    const developerIds: string[] = [];
    const publisherIds: string[] = [];

    if (involvedCompanies.length === 0) {
      return { developerIds, publisherIds };
    }

    const supabase = await createRouteHandlerClient();

    for (const ic of involvedCompanies) {
      // Check if company exists by slug
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", ic.company.slug)
        .single();

      let companyId: string;

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // Create new company
        const { data: newCompany, error } = await supabase
          .from("companies")
          .insert({
            name: ic.company.name,
            slug: ic.company.slug,
            company_type: ic.developer ? "developer" : ic.publisher ? "publisher" : null,
          })
          .select("id")
          .single();

        if (!newCompany || error) {
          logger.error("Failed to create company", { name: ic.company.name, error });
          continue;
        }

        companyId = newCompany.id;
      }

      // Add to appropriate arrays
      if (ic.developer) {
        developerIds.push(companyId);
      }
      if (ic.publisher) {
        publisherIds.push(companyId);
      }
    }

    return { developerIds, publisherIds };
  }

  /**
   * Creates translations for a game (EN and FR)
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async createTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Use summary or storyline as description
    const description = igdbGame.summary || igdbGame.storyline || null;

    // Only create English translation — IGDB data is English only
    await supabase.from("game_translations").insert({
      game_id: gameId,
      language_code: "en",
      title: igdbGame.name,
      description,
    });
  }

  /**
   * Updates translations for an existing game
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async updateTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
    const supabase = await createRouteHandlerClient();
    const description = igdbGame.summary || igdbGame.storyline || null;

    // Only update English translation — IGDB data is English only
    // French translations will be managed by a separate translation service
    await supabase
      .from("game_translations")
      .update({ title: igdbGame.name, description })
      .eq("game_id", gameId)
      .eq("language_code", "en");
  }

  /**
   * Links genres to a game
   *
   * @param gameId The game UUID
   * @param genreIds Array of genre UUIDs
   */
  private static async linkGenres(gameId: string, genreIds: string[]): Promise<void> {
    const supabase = await createRouteHandlerClient();

    const gameGenres = genreIds.map((genreId) => ({
      game_id: gameId,
      genre_id: genreId,
    }));

    await supabase.from("game_genres").insert(gameGenres);
  }

  /**
   * Links companies to a game with a specific role
   *
   * @param gameId The game UUID
   * @param companyIds Array of company UUIDs
   * @param role The company role (developer or publisher)
   */
  private static async linkCompanies(
    gameId: string,
    companyIds: string[],
    role: "developer" | "publisher"
  ): Promise<void> {
    const supabase = await createRouteHandlerClient();

    const gameCompanies = companyIds.map((companyId, index) => ({
      game_id: gameId,
      company_id: companyId,
      role,
      is_primary: index === 0, // First company is primary
    }));

    await supabase.from("game_companies").insert(gameCompanies);
  }

  /**
   * Creates media entries (screenshots, artwork) for a game
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async createMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Create screenshots
    if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
      const screenshots = igdbGame.screenshots.map((ss, index) => ({
        game_id: gameId,
        url: IGDBService.buildImageUrl(ss.image_id, "1080p"),
        display_order: index,
        is_featured: index === 0,
      }));

      await supabase.from("game_screenshots").insert(screenshots);
    }

    // Create artwork
    if (igdbGame.artworks && igdbGame.artworks.length > 0) {
      const artworks = igdbGame.artworks.map((art, index) => ({
        game_id: gameId,
        url: IGDBService.buildImageUrl(art.image_id, "1080p"),
        artwork_type: "promotional",
        display_order: index,
        is_featured: index === 0,
      }));

      await supabase.from("game_artwork").insert(artworks);
    }
  }

  /**
   * Updates media entries for an existing game
   * Replaces existing media with fresh data from IGDB
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async updateMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Delete existing screenshots and artwork
    await supabase.from("game_screenshots").delete().eq("game_id", gameId);
    await supabase.from("game_artwork").delete().eq("game_id", gameId);

    // Create new media
    await this.createMedia(gameId, igdbGame);
  }

  /**
   * Creates language support entries for a game
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async createLanguages(gameId: string, igdbGame: IGDBGame): Promise<void> {
    if (!igdbGame.language_supports || igdbGame.language_supports.length === 0) {
      return;
    }

    const supabase = await createRouteHandlerClient();

    // Group language supports by language to consolidate audio/subtitles/interface
    const languageMap = new Map<
      string,
      {
        name: string;
        nativeName: string;
        code: string;
        hasAudio: boolean;
        hasSubtitles: boolean;
        hasInterface: boolean;
      }
    >();

    for (const ls of igdbGame.language_supports) {
      if (!ls.language?.locale) continue;

      // Extract base language code (e.g., 'en' from 'en-US')
      const langCode = ls.language.locale.split("-")[0].toLowerCase();
      const langName = ls.language.name || ls.language.native_name || langCode;
      const langNativeName = ls.language.native_name || ls.language.name || langCode;

      const existing = languageMap.get(langCode) || {
        name: langName,
        nativeName: langNativeName,
        code: langCode,
        hasAudio: false,
        hasSubtitles: false,
        hasInterface: false,
      };

      // IGDB language_support_type: 1 = Audio, 2 = Subtitles, 3 = Interface
      const supportType = ls.language_support_type?.name?.toLowerCase() || "";
      if (supportType.includes("audio")) {
        existing.hasAudio = true;
      } else if (supportType.includes("subtitle")) {
        existing.hasSubtitles = true;
      } else if (supportType.includes("interface")) {
        existing.hasInterface = true;
      }

      languageMap.set(langCode, existing);
    }

    const langs = Array.from(languageMap.values());

    // Ensure all languages exist in supported_languages reference table
    if (langs.length > 0) {
      const supportedRows = langs.map((l) => ({
        code: l.code,
        name: l.name,
        native_name: l.nativeName,
      }));
      // upsert: insert if missing, do nothing if already exists
      const { error: upsertErr } = await supabase
        .from("supported_languages")
        .upsert(supportedRows, { onConflict: "code", ignoreDuplicates: true });
      if (upsertErr) {
        logger.warn("Failed to upsert supported_languages", { error: upsertErr });
      }

      // Fetch back the canonical names from supported_languages
      const codes = langs.map((l) => l.code);
      const { data: supportedLangs } = await supabase
        .from("supported_languages")
        .select("code, name")
        .in("code", codes);

      const nameMap = new Map((supportedLangs ?? []).map((sl) => [sl.code, sl.name]));

      // Insert game_languages using canonical names
      const languageEntries = langs.map((lang) => ({
        game_id: gameId,
        language_code: lang.code,
        language_name: nameMap.get(lang.code) ?? lang.name,
        has_audio: lang.hasAudio,
        has_subtitles: lang.hasSubtitles,
        has_interface: lang.hasInterface,
      }));

      const { error } = await supabase.from("game_languages").insert(languageEntries);
      if (error) {
        logger.error("Failed to insert game languages", { gameId, error });
      }
    }
  }

  /**
   * Updates language support entries for an existing game
   * Replaces existing languages with fresh data from IGDB
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async updateLanguages(gameId: string, igdbGame: IGDBGame): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Delete existing languages
    await supabase.from("game_languages").delete().eq("game_id", gameId);

    // Create new languages
    await this.createLanguages(gameId, igdbGame);
  }

  /**
   * Fetches complete game details by slug
   *
   * @param slug The game slug
   * @returns GameDetails or null if not found
   */
  private static async fetchGameDetails(slug: string): Promise<GameDetails | null> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/games/${slug}?locale=en`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error("Error fetching game details", { slug, error });
      return null;
    }
  }

  /**
   * Creates age ratings for a game from IGDB data
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async createAgeRatings(gameId: string, igdbGame: IGDBGame): Promise<void> {
    if (!igdbGame.age_ratings || igdbGame.age_ratings.length === 0) {
      return;
    }

    // Extract age rating IDs
    const ageRatingIds = igdbGame.age_ratings
      .map((ar) => ar.id)
      .filter((id): id is number => id !== undefined);

    // Fetch full age rating details from IGDB (category, rating, rating_cover_url)
    const ageRatings = await IGDBService.getAgeRatings(ageRatingIds);

    if (ageRatings.length === 0) {
      return;
    }

    const supabase = await createRouteHandlerClient();

    for (let i = 0; i < ageRatings.length; i++) {
      const ageRating = ageRatings[i];

      // Use new field names: organization and rating_category
      const organization = ageRating.organization;
      const ratingCategory = ageRating.rating_category;

      if (organization === undefined || ratingCategory === undefined) {
        continue;
      }

      const systemCode = IGDB_RATING_CATEGORIES[organization];

      if (!systemCode) {
        logger.warn("Unknown IGDB age rating organization", { organization });
        continue;
      }

      // Get rating details from the unified mapping (uses rating_category values)
      const ratingInfo = IGDB_ALL_RATINGS[ratingCategory];

      let ratingCode: string;
      let displayName: string;
      let minimumAge: number | null = null;
      const iconUrl = ageRating.rating_cover_url || null;

      if (ratingInfo) {
        ratingCode = ratingInfo.code;
        displayName = ratingInfo.name;
        minimumAge = ratingInfo.age;
      } else {
        ratingCode = String(ratingCategory);
        displayName = `${systemCode} ${ratingCategory}`;
      }

      // Find or create rating system
      let { data: ratingSystem } = await supabase
        .from("rating_systems")
        .select("id")
        .eq("code", systemCode)
        .single();

      if (!ratingSystem) {
        const { data: newSystem, error } = await supabase
          .from("rating_systems")
          .insert({ code: systemCode, name: systemCode })
          .select("id")
          .single();

        if (error || !newSystem) {
          logger.error("Failed to create rating system", { systemCode, error });
          continue;
        }
        ratingSystem = newSystem;
      }

      // Find or create rating
      let { data: rating } = await supabase
        .from("ratings")
        .select("id, icon_url")
        .eq("rating_system_id", ratingSystem.id)
        .eq("code", ratingCode)
        .single();

      if (!rating) {
        const { data: newRating, error } = await supabase
          .from("ratings")
          .insert({
            rating_system_id: ratingSystem.id,
            code: ratingCode,
            display_name: displayName,
            minimum_age: minimumAge,
            icon_url: iconUrl,
          })
          .select("id")
          .single();

        if (error || !newRating) {
          logger.error("Failed to create rating", { displayName, error });
          continue;
        }
        rating = { id: newRating.id, icon_url: iconUrl };
      } else if (iconUrl && !rating.icon_url) {
        // Update existing rating with icon_url if it doesn't have one
        await supabase.from("ratings").update({ icon_url: iconUrl }).eq("id", rating.id);
      }

      // Create game_rating link
      const { data: gameRating, error: gameRatingError } = await supabase
        .from("game_ratings")
        .insert({
          game_id: gameId,
          rating_id: rating.id,
          is_primary: i === 0, // First rating is primary
        })
        .select("id")
        .single();

      if (gameRatingError || !gameRating) {
        logger.error("Failed to link rating to game", { gameId, error: gameRatingError });
        continue;
      }

      // Create content descriptors if available
      if (ageRating.content_descriptions && ageRating.content_descriptions.length > 0) {
        for (const desc of ageRating.content_descriptions) {
          // Find or create content descriptor
          let { data: descriptor } = await supabase
            .from("content_descriptors")
            .select("id")
            .eq("rating_system_id", ratingSystem.id)
            .eq("code", String(desc.category))
            .single();

          if (!descriptor) {
            const { data: newDescriptor, error } = await supabase
              .from("content_descriptors")
              .insert({
                rating_system_id: ratingSystem.id,
                code: String(desc.category),
              })
              .select("id")
              .single();

            if (error || !newDescriptor) {
              logger.error("Failed to create content descriptor", { error });
              continue;
            }
            descriptor = newDescriptor;

            // Create translations for the descriptor
            await supabase.from("content_descriptor_translations").insert([
              { content_descriptor_id: descriptor.id, language_code: "en", name: desc.description },
              { content_descriptor_id: descriptor.id, language_code: "fr", name: desc.description },
            ]);
          }

          // Link descriptor to game rating
          await supabase.from("game_rating_descriptors").insert({
            game_rating_id: gameRating.id,
            content_descriptor_id: descriptor.id,
          });
        }
      }
    }
  }

  /**
   * Updates age ratings for an existing game
   * Replaces existing ratings with fresh data from IGDB
   *
   * @param gameId The game UUID
   * @param igdbGame The IGDB game data
   */
  private static async updateAgeRatings(gameId: string, igdbGame: IGDBGame): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Get existing game ratings to delete their descriptors first
    const { data: existingRatings } = await supabase
      .from("game_ratings")
      .select("id")
      .eq("game_id", gameId);

    if (existingRatings && existingRatings.length > 0) {
      // Delete descriptors for each rating
      for (const rating of existingRatings) {
        await supabase.from("game_rating_descriptors").delete().eq("game_rating_id", rating.id);
      }
      // Delete the ratings themselves
      await supabase.from("game_ratings").delete().eq("game_id", gameId);
    }

    // Create new age ratings
    await this.createAgeRatings(gameId, igdbGame);
  }

  /**
   * Creates game versions (editions) from IGDB data
   *
   * @param gameId The game UUID
   * @param igdbId The IGDB game ID
   */
  private static async createVersions(gameId: string, igdbId: number): Promise<void> {
    try {
      const versions = await IGDBService.getGameVersions(igdbId);

      if (!versions || versions.length === 0) {
        return;
      }

      const supabase = await createRouteHandlerClient();

      const versionEntries = versions.map((version, index) => ({
        game_id: gameId,
        igdb_id: version.id,
        version_title: version.version_title || version.name,
        description: version.summary || null,
        cover_image_url: version.cover?.image_id
          ? IGDBService.buildImageUrl(version.cover.image_id, "cover_big")
          : null,
        display_order: index,
      }));

      // Use type assertion since game_versions may not be in generated types yet
      const { error } = await (
        supabase.from("game_versions") as ReturnType<typeof supabase.from>
      ).insert(versionEntries as unknown[]);

      if (error) {
        logger.error("Failed to insert game versions", { gameId, error });
      }
    } catch (error) {
      logger.error("Error creating game versions", { gameId, igdbId, error });
    }
  }

  /**
   * Updates game versions for an existing game
   * Replaces existing versions with fresh data from IGDB
   *
   * @param gameId The game UUID
   * @param igdbId The IGDB game ID
   */
  private static async updateVersions(gameId: string, igdbId: number): Promise<void> {
    const supabase = await createRouteHandlerClient();

    // Delete existing versions (use type assertion since table may not be in generated types)
    await (supabase.from("game_versions") as ReturnType<typeof supabase.from>)
      .delete()
      .eq("game_id", gameId);

    // Create new versions
    await this.createVersions(gameId, igdbId);
  }

  /**
   * Creates DLC, expansion, and bundle entries for a game from IGDB data.
   *
   * Collects tagged IDs from igdbGame.dlcs/expansions/bundles, fetches details
   * from IGDB in a single batch, then upserts into game_dlc_extensions.
   * Wrapped in try/catch so failures don't block the main import.
   *
   * Requirements: 3.1, 4.1
   */
  private static async createDlcExtensions(gameId: string, igdbGame: IGDBGame): Promise<void> {
    try {
      const taggedIds = collectDlcExtensionIds(igdbGame);

      if (taggedIds.length === 0) {
        return;
      }

      // Build a map of igdbId → sourceCategory for quick lookup after fetch
      const categoryByIgdbId = new Map(
        taggedIds.map(({ id, sourceCategory }) => [id, sourceCategory])
      );

      const allIds = taggedIds.map(({ id }) => id);
      const dlcDetails = await IGDBService.getDlcExtensions(allIds);

      if (!dlcDetails || dlcDetails.length === 0) {
        return;
      }

      const rows = dlcDetails.map((ext, index) => {
        const sourceCategory = categoryByIgdbId.get(ext.id) ?? "dlc";
        return transformIgdbToDlcExtensionRow(ext, gameId, sourceCategory, index);
      });

      const supabase = await createRouteHandlerClient();

      const { error } = await (
        supabase.from("game_dlc_extensions") as ReturnType<typeof supabase.from>
      ).upsert(rows as unknown[], { onConflict: "game_id,igdb_id" });

      if (error) {
        logger.error("Failed to upsert DLC extensions", { gameId, error });
      }
    } catch (error) {
      logger.error("Error creating DLC extensions", { gameId, error });
    }
  }

  /**
   * Updates DLC extensions for a game by deleting existing entries then re-creating.
   *
   * Follows the same pattern as updateVersions: delete all existing rows for the
   * game, then delegate to createDlcExtensions for a fresh insert.
   * Wrapped in try/catch so failures don't block the main sync.
   *
   * Requirements: 3.4, 4.2
   */
  private static async updateDlcExtensions(gameId: string, igdbGame: IGDBGame): Promise<void> {
    try {
      const supabase = await createRouteHandlerClient();

      await (supabase.from("game_dlc_extensions") as ReturnType<typeof supabase.from>)
        .delete()
        .eq("game_id", gameId);

      await this.createDlcExtensions(gameId, igdbGame);
    } catch (error) {
      logger.error("Error updating DLC extensions", { gameId, error });
    }
  }
}
