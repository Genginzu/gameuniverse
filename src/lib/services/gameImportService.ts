import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBGame } from "@/types/igdb";
import { GameDetails } from "@/types/game";
import { IGDBService } from "./igdbService";

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
  last_synced_at: string;
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
      console.log(`[GameImportService] Starting import for IGDB ID: ${igdbId}`);

      // Fetch complete game details from IGDB
      const igdbGame = await IGDBService.getGameDetails(igdbId);

      if (!igdbGame) {
        console.log(`[GameImportService] Game not found in IGDB: ${igdbId}`);
        return {
          success: false,
          error: `Game with IGDB ID ${igdbId} not found`,
        };
      }

      console.log(`[GameImportService] IGDB game found: ${igdbGame.name}`);

      const supabase = await createRouteHandlerClient();

      // Check if game already exists with this IGDB ID
      const { data: existingGame, error: checkError } = await supabase
        .from("games")
        .select("id, slug")
        .eq("igdb_id", igdbId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error(`[GameImportService] Error checking existing game:`, checkError);
      }

      if (existingGame) {
        console.log(`[GameImportService] Game already exists: ${existingGame.slug}`);
        return {
          success: false,
          error: `Game with IGDB ID ${igdbId} already exists (slug: ${existingGame.slug})`,
        };
      }

      // Ensure related entities exist (genres, companies)
      console.log(`[GameImportService] Ensuring related entities...`);
      const relatedEntities = await this.ensureRelatedEntities(igdbGame);
      console.log(`[GameImportService] Related entities:`, relatedEntities);

      // Transform IGDB data to Supabase format
      const gameData = this.transformIGDBToSupabase(igdbGame);
      console.log(`[GameImportService] Transformed game data:`, gameData);

      // Insert the game
      const { data: newGame, error: gameError } = await supabase
        .from("games")
        .insert(gameData)
        .select("id, slug")
        .single();

      if (gameError || !newGame) {
        console.error(`[GameImportService] Failed to insert game:`, gameError);
        return {
          success: false,
          error: `Failed to create game: ${gameError?.message || "Unknown error"}`,
        };
      }

      console.log(`[GameImportService] Game created: ${newGame.slug}`);

      // Create translations (FR and EN)
      await this.createTranslations(newGame.id, igdbGame);
      console.log(`[GameImportService] Translations created`);

      // Link genres
      if (relatedEntities.genreIds.length > 0) {
        await this.linkGenres(newGame.id, relatedEntities.genreIds);
        console.log(`[GameImportService] Genres linked`);
      }

      // Link companies (developers and publishers)
      if (relatedEntities.developerIds.length > 0) {
        await this.linkCompanies(newGame.id, relatedEntities.developerIds, "developer");
        console.log(`[GameImportService] Developers linked`);
      }
      if (relatedEntities.publisherIds.length > 0) {
        await this.linkCompanies(newGame.id, relatedEntities.publisherIds, "publisher");
        console.log(`[GameImportService] Publishers linked`);
      }

      // Create media entries (screenshots, artwork)
      await this.createMedia(newGame.id, igdbGame);
      console.log(`[GameImportService] Media created`);

      // Fetch the complete game details to return
      const gameDetails = await this.fetchGameDetails(newGame.slug);
      console.log(`[GameImportService] Import complete for: ${newGame.slug}`);

      return {
        success: true,
        game: gameDetails || undefined,
      };
    } catch (error) {
      console.error("[GameImportService] Error importing game from IGDB:", error);
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
        console.warn(`IGDB game ${igdbId} not found during sync, preserving existing data`);
        return {
          success: false,
          error: `IGDB game ${igdbId} not found`,
        };
      }

      // Update game with fresh IGDB data
      const updateData = this.transformIGDBToSupabaseUpdate(igdbGame);

      const { error: updateError } = await supabase
        .from("games")
        .update(updateData)
        .eq("id", gameId);

      if (updateError) {
        // Update failed - existing data is preserved (Requirement 4.4)
        console.error("Failed to update game:", updateError);
        return {
          success: false,
          error: `Failed to update game: ${updateError.message}`,
        };
      }

      // Update translations
      await this.updateTranslations(gameId, igdbGame);

      // Update media (screenshots, artwork)
      await this.updateMedia(gameId, igdbGame);

      // Fetch updated game details
      const gameDetails = await this.fetchGameDetails(currentGame.slug);

      return {
        success: true,
        game: gameDetails || undefined,
      };
    } catch (error) {
      // Any error preserves existing data (Requirement 4.4)
      console.error("Error syncing game with IGDB:", error);
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
      last_synced_at: new Date().toISOString(),
    };
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
    return {
      release_date: baseData.release_date,
      metascore: baseData.metascore,
      cover_image_url: baseData.cover_image_url,
      background_image_url: baseData.background_image_url,
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

    // Create English translation
    await supabase.from("genre_translations").insert({
      genre_id: genreId,
      language_code: "en",
      name: name,
    });

    // Create French translation (same as English for now, can be updated later)
    await supabase.from("genre_translations").insert({
      genre_id: genreId,
      language_code: "fr",
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
          console.error(`Failed to create company ${ic.company.name}:`, error);
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

    // Create English translation
    await supabase.from("game_translations").insert({
      game_id: gameId,
      language_code: "en",
      title: igdbGame.name,
      description,
    });

    // Create French translation (same as English for now)
    await supabase.from("game_translations").insert({
      game_id: gameId,
      language_code: "fr",
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

    // Update English translation
    await supabase
      .from("game_translations")
      .update({ title: igdbGame.name, description })
      .eq("game_id", gameId)
      .eq("language_code", "en");

    // Update French translation
    await supabase
      .from("game_translations")
      .update({ title: igdbGame.name, description })
      .eq("game_id", gameId)
      .eq("language_code", "fr");
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
        url: IGDBService.buildImageUrl(ss.image_id, "screenshot_big"),
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
      console.error("Error fetching game details:", error);
      return null;
    }
  }
}
