/**
 * Game Importer for standalone scripts
 * Adapted from GameImportService but uses script-compatible Supabase client
 */

import { createScriptClient } from "./supabase-client";
import { IGDBService } from "../../src/lib/services/igdbService";
import type { IGDBGame } from "../../src/types/igdb";
import { IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS } from "../../src/types/igdb";

export interface ImportResult {
  success: boolean;
  gameSlug?: string;
  error?: string;
}

/**
 * Imports a game from IGDB into Supabase (script version)
 */
export async function importGameFromIGDB(
  igdbId: number,
  verbose: boolean = false,
  dryRun: boolean = false
): Promise<ImportResult> {
  try {
    if (verbose) {
      console.log(`[Importer] Starting import for IGDB ID: ${igdbId}`);
    }

    // Fetch game details from IGDB
    const igdbGame = await IGDBService.getGameDetails(igdbId);

    if (!igdbGame) {
      return {
        success: false,
        error: `Game with IGDB ID ${igdbId} not found in IGDB`,
      };
    }

    if (verbose) {
      console.log(`[Importer] Found game: ${igdbGame.name}`);
    }

    const supabase = createScriptClient();

    // Check if game already exists
    const { data: existingGame, error: checkError } = await supabase
      .from("games")
      .select("id, slug")
      .eq("igdb_id", igdbId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = not found, which is expected
      console.error(`[Importer] Error checking existing game:`, checkError);
    }

    if (existingGame) {
      return {
        success: false,
        error: `Game with IGDB ID ${igdbId} already exists (slug: ${existingGame.slug})`,
      };
    }

    // Ensure related entities exist
    const relatedEntities = await ensureRelatedEntities(igdbGame, verbose);

    // Transform and insert game
    const gameData = transformIGDBToSupabase(igdbGame);

    const { data: newGame, error: gameError } = await supabase
      .from("games")
      .insert(gameData)
      .select("id, slug")
      .single();

    if (gameError || !newGame) {
      return {
        success: false,
        error: `Failed to create game: ${gameError?.message || "Unknown error"}`,
      };
    }

    if (verbose) {
      console.log(`[Importer] Game created: ${newGame.slug}`);
    }

    // Create translations
    await createTranslations(newGame.id, igdbGame);

    // Link genres
    if (relatedEntities.genreIds.length > 0) {
      await linkGenres(newGame.id, relatedEntities.genreIds);
    }

    // Link companies
    if (relatedEntities.developerIds.length > 0) {
      await linkCompanies(newGame.id, relatedEntities.developerIds, "developer");
    }
    if (relatedEntities.publisherIds.length > 0) {
      await linkCompanies(newGame.id, relatedEntities.publisherIds, "publisher");
    }

    // Create media
    await createMedia(newGame.id, igdbGame);

    // Create languages
    await createLanguages(newGame.id, igdbGame);

    // Create age ratings
    await createAgeRatings(newGame.id, igdbGame, verbose);

    // Fetch and save playtime
    await fetchAndSavePlaytime(newGame.id, igdbGame.id, verbose);

    // Import game versions (editions)
    const versionsCount = await importGameVersions(newGame.id, igdbGame.id, verbose, dryRun);
    if (verbose && versionsCount > 0) {
      console.log(`[Importer] Imported ${versionsCount} versions for game`);
    }

    return {
      success: true,
      gameSlug: newGame.slug,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during import",
    };
  }
}

function transformIGDBToSupabase(igdbGame: IGDBGame) {
  const coverUrl = igdbGame.cover?.image_id
    ? IGDBService.buildImageUrl(igdbGame.cover.image_id, "cover_big")
    : null;

  let backgroundUrl: string | null = null;
  if (igdbGame.artworks && igdbGame.artworks.length > 0) {
    backgroundUrl = IGDBService.buildImageUrl(igdbGame.artworks[0].image_id, "1080p");
  } else if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
    backgroundUrl = IGDBService.buildImageUrl(igdbGame.screenshots[0].image_id, "1080p");
  }

  const releaseDate = igdbGame.first_release_date
    ? new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0]
    : null;

  const metascore = igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null;

  return {
    slug: igdbGame.slug,
    igdb_id: igdbGame.id,
    release_date: releaseDate,
    metascore,
    cover_image_url: coverUrl,
    background_image_url: backgroundUrl,
    last_synced_at: new Date().toISOString(),
    playtime_hastily: null,
    playtime_normally: null,
    playtime_completely: null,
    playtime_updated_at: null,
  };
}

interface RelatedEntities {
  genreIds: string[];
  developerIds: string[];
  publisherIds: string[];
}

async function ensureRelatedEntities(
  igdbGame: IGDBGame,
  verbose: boolean
): Promise<RelatedEntities> {
  const genreIds = await ensureGenres(igdbGame.genres || []);
  const { developerIds, publisherIds } = await ensureCompanies(igdbGame.involved_companies || []);

  if (verbose) {
    console.log(
      `[Importer] Related entities - Genres: ${genreIds.length}, Devs: ${developerIds.length}, Pubs: ${publisherIds.length}`
    );
  }

  return { genreIds, developerIds, publisherIds };
}

async function ensureGenres(
  igdbGenres: Array<{ id: number; name: string; slug: string }>
): Promise<string[]> {
  if (igdbGenres.length === 0) return [];

  const supabase = createScriptClient();
  const genreIds: string[] = [];

  for (const igdbGenre of igdbGenres) {
    const { data: existingGenre } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", igdbGenre.slug)
      .single();

    if (existingGenre) {
      genreIds.push(existingGenre.id);
    } else {
      const { data: newGenre, error } = await supabase
        .from("genres")
        .insert({ slug: igdbGenre.slug })
        .select("id")
        .single();

      if (newGenre && !error) {
        genreIds.push(newGenre.id);
        await createGenreTranslations(newGenre.id, igdbGenre.name);
      }
    }
  }

  return genreIds;
}

async function createGenreTranslations(genreId: string, name: string): Promise<void> {
  const supabase = createScriptClient();

  await supabase.from("genre_translations").insert([
    { genre_id: genreId, language_code: "en", name },
    { genre_id: genreId, language_code: "fr", name },
  ]);
}

async function ensureCompanies(
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

  const supabase = createScriptClient();

  for (const ic of involvedCompanies) {
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", ic.company.slug)
      .single();

    let companyId: string;

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
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
        continue;
      }

      companyId = newCompany.id;
    }

    if (ic.developer) developerIds.push(companyId);
    if (ic.publisher) publisherIds.push(companyId);
  }

  return { developerIds, publisherIds };
}

async function createTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = createScriptClient();
  const description = igdbGame.summary || igdbGame.storyline || null;

  await supabase.from("game_translations").insert([
    { game_id: gameId, language_code: "en", title: igdbGame.name, description },
    { game_id: gameId, language_code: "fr", title: igdbGame.name, description },
  ]);
}

async function linkGenres(gameId: string, genreIds: string[]): Promise<void> {
  const supabase = createScriptClient();

  const gameGenres = genreIds.map((genreId) => ({
    game_id: gameId,
    genre_id: genreId,
  }));

  await supabase.from("game_genres").insert(gameGenres);
}

async function linkCompanies(
  gameId: string,
  companyIds: string[],
  role: "developer" | "publisher"
): Promise<void> {
  const supabase = createScriptClient();

  const gameCompanies = companyIds.map((companyId, index) => ({
    game_id: gameId,
    company_id: companyId,
    role,
    is_primary: index === 0,
  }));

  await supabase.from("game_companies").insert(gameCompanies);
}

async function createMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = createScriptClient();

  if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
    const screenshots = igdbGame.screenshots.map((ss, index) => ({
      game_id: gameId,
      url: IGDBService.buildImageUrl(ss.image_id, "screenshot_big"),
      display_order: index,
      is_featured: index === 0,
    }));

    await supabase.from("game_screenshots").insert(screenshots);
  }

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

async function createLanguages(gameId: string, igdbGame: IGDBGame): Promise<void> {
  if (!igdbGame.language_supports || igdbGame.language_supports.length === 0) {
    return;
  }

  const supabase = createScriptClient();

  const languageMap = new Map<
    string,
    {
      name: string;
      code: string;
      hasAudio: boolean;
      hasSubtitles: boolean;
      hasInterface: boolean;
    }
  >();

  for (const ls of igdbGame.language_supports) {
    if (!ls.language?.locale) continue;

    const langCode = ls.language.locale.split("-")[0].toLowerCase();
    const langName = ls.language.name || ls.language.native_name || langCode;

    const existing = languageMap.get(langCode) || {
      name: langName,
      code: langCode,
      hasAudio: false,
      hasSubtitles: false,
      hasInterface: false,
    };

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

  const languageEntries = Array.from(languageMap.values()).map((lang) => ({
    game_id: gameId,
    language_code: lang.code,
    language_name: lang.name,
    has_audio: lang.hasAudio,
    has_subtitles: lang.hasSubtitles,
    has_interface: lang.hasInterface,
  }));

  if (languageEntries.length > 0) {
    await supabase.from("game_languages").insert(languageEntries);
  }
}

async function createAgeRatings(
  gameId: string,
  igdbGame: IGDBGame,
  verbose: boolean
): Promise<void> {
  if (verbose) {
    console.log(`[Importer] Age ratings from game data:`, JSON.stringify(igdbGame.age_ratings));
  }

  if (!igdbGame.age_ratings || igdbGame.age_ratings.length === 0) {
    if (verbose) {
      console.log(`[Importer] No age ratings in game data`);
    }
    return;
  }

  // The age_ratings from the batch query already contain organization and rating_category
  // We can use them directly instead of making another API call
  const supabase = createScriptClient();

  for (const ageRating of igdbGame.age_ratings) {
    const organization = ageRating.organization;
    const ratingCategory = ageRating.rating_category;

    if (verbose) {
      console.log(
        `[Importer] Processing age rating - org: ${organization}, category: ${ratingCategory}`
      );
    }

    if (organization === undefined || ratingCategory === undefined) {
      if (verbose) {
        console.log(`[Importer] Skipping age rating - missing org or category`);
      }
      continue;
    }

    const systemCode = IGDB_RATING_CATEGORIES[organization];

    if (!systemCode) {
      if (verbose) {
        console.log(`[Importer] Unknown rating organization: ${organization}`);
      }
      continue;
    }

    const ratingInfo = IGDB_ALL_RATINGS[ratingCategory];

    let ratingCode: string;
    let displayName: string;
    let minimumAge: number | null = null;

    if (ratingInfo) {
      ratingCode = ratingInfo.code;
      displayName = ratingInfo.name;
      minimumAge = ratingInfo.age;
    } else {
      ratingCode = String(ratingCategory);
      displayName = `${systemCode} ${ratingCategory}`;
      if (verbose) {
        console.log(`[Importer] Unknown rating_category: ${ratingCategory} for ${systemCode}`);
      }
    }

    if (verbose) {
      console.log(`[Importer] Creating rating: ${displayName} (${systemCode})`);
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
        if (verbose) {
          console.log(`[Importer] Failed to create rating system ${systemCode}:`, error);
        }
        continue;
      }
      ratingSystem = newSystem;
    }

    // Find or create rating (in the "ratings" table, not "age_ratings")
    let { data: rating } = await supabase
      .from("ratings")
      .select("id")
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
          icon_url: null,
        })
        .select("id")
        .single();

      if (error || !newRating) {
        if (verbose) {
          console.log(`[Importer] Failed to create rating ${ratingCode}:`, error);
        }
        continue;
      }
      rating = newRating;
    }

    // Link game to rating via game_ratings table
    const { error: linkError } = await supabase.from("game_ratings").insert({
      game_id: gameId,
      rating_id: rating.id,
      is_primary: igdbGame.age_ratings.indexOf(ageRating) === 0, // First rating is primary
    });

    if (linkError) {
      if (verbose) {
        console.log(`[Importer] Failed to link game to rating:`, linkError);
      }
    } else if (verbose) {
      console.log(`[Importer] Linked game to rating: ${displayName}`);
    }
  }
}

/**
 * Imports game versions (editions) from IGDB for a given game
 * @param gameId The UUID of the game in our database
 * @param igdbId The IGDB ID of the parent game
 * @param verbose Whether to log verbose output
 * @param dryRun If true, don't write to database
 * @returns Number of versions imported
 */
async function importGameVersions(
  gameId: string,
  igdbId: number,
  verbose: boolean,
  dryRun: boolean = false
): Promise<number> {
  try {
    const versions = await IGDBService.getGameVersions(igdbId);

    if (versions.length === 0) {
      if (verbose) {
        console.log(`[Importer] No versions found for IGDB ID: ${igdbId}`);
      }
      return 0;
    }

    if (verbose) {
      console.log(`[Importer] Found ${versions.length} versions for IGDB ID: ${igdbId}`);
    }

    if (dryRun) {
      if (verbose) {
        console.log(`[Importer] Dry-run: Would import ${versions.length} versions`);
        for (const version of versions) {
          console.log(`[Importer]   - ${version.version_title || version.name}`);
        }
      }
      return versions.length;
    }

    const supabase = createScriptClient();
    let importedCount = 0;

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      const coverUrl = version.cover?.image_id
        ? IGDBService.buildImageUrl(version.cover.image_id, "cover_big")
        : null;

      const { error } = await supabase.from("game_versions").upsert(
        {
          game_id: gameId,
          igdb_id: version.id,
          version_title: version.version_title || version.name,
          cover_image_url: coverUrl,
          display_order: i,
        },
        {
          onConflict: "game_id,igdb_id",
        }
      );

      if (!error) {
        importedCount++;
      } else if (verbose) {
        console.log(`[Importer] Error importing version ${version.name}:`, error.message);
      }
    }

    if (verbose) {
      console.log(`[Importer] Imported ${importedCount} versions for game`);
    }

    return importedCount;
  } catch (error) {
    if (verbose) {
      console.error(`[Importer] Error importing versions for IGDB ID ${igdbId}:`, error);
    }
    return 0;
  }
}

async function fetchAndSavePlaytime(
  gameId: string,
  igdbId: number,
  verbose: boolean
): Promise<void> {
  try {
    const timeToBeat = await IGDBService.getTimeToBeat(igdbId);

    if (!timeToBeat) {
      if (verbose) {
        console.log(`[Importer] No playtime data for IGDB ID: ${igdbId}`);
      }
      return;
    }

    const secondsToHours = (seconds: number | null | undefined): number | null => {
      if (seconds === null || seconds === undefined || seconds === 0 || isNaN(seconds)) return null;
      return Math.round((seconds / 3600) * 10) / 10;
    };

    const hastily = secondsToHours(timeToBeat.hastily);
    const normally = secondsToHours(timeToBeat.normally);
    const completely = secondsToHours(timeToBeat.completely);

    if (hastily === null && normally === null && completely === null) {
      return;
    }

    const supabase = createScriptClient();

    await supabase
      .from("games")
      .update({
        playtime_hastily: hastily,
        playtime_normally: normally,
        playtime_completely: completely,
        playtime_updated_at: new Date().toISOString(),
      })
      .eq("id", gameId);
  } catch (error) {
    if (verbose) {
      console.error(`[Importer] Error fetching playtime for IGDB ID ${igdbId}:`, error);
    }
  }
}
