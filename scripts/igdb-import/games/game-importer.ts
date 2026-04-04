/**
 * Game Importer for standalone scripts
 * Adapted from GameImportService but uses script-compatible Supabase client
 */

import { createScriptClient } from "../shared/supabase-client";
import { IGDBService } from "../../../src/lib/services/igdbService";
import type { IGDBGame } from "../../../src/types/igdb";
import {
  collectDlcExtensionIds,
  transformIgdbToDlcExtensionRow,
} from "../../../src/lib/utils/dlcExtensionUtils";
import { IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS } from "../../../src/types/igdb"; // eslint-disable-line no-duplicate-imports
import { extractColorsFromCover } from "../shared/color-extractor";
import { syncExistingGame } from "./game-sync";
import { ensurePlatforms, linkPlatforms } from "./platform-importer";
import { transformIgdbVideos } from "./video-transform";

export interface ImportResult {
  success: boolean;
  gameSlug?: string;
  /** Indicates the game was synced (updated) rather than newly imported */
  synced?: boolean;
  error?: string;
}

/**
 * Imports a game from IGDB into Supabase (script version).
 * Accepts a pre-fetched IGDBGame object to avoid redundant API calls.
 * Falls back to fetching from IGDB if no object is provided.
 */
export async function importGameFromIGDB(
  igdbIdOrGame: number | IGDBGame,
  verbose: boolean = false,
  dryRun: boolean = false
): Promise<ImportResult> {
  try {
    // Resolve the IGDB game object — reuse if already fetched, otherwise fetch
    let igdbGame: IGDBGame;
    if (typeof igdbIdOrGame === "number") {
      if (verbose) {
        console.log(`[Importer] Fetching game from IGDB ID: ${igdbIdOrGame}`);
      }
      const fetched = await IGDBService.getGameDetails(igdbIdOrGame);
      if (!fetched) {
        return {
          success: false,
          error: `Game with IGDB ID ${igdbIdOrGame} not found in IGDB`,
        };
      }
      igdbGame = fetched;
    } else {
      igdbGame = igdbIdOrGame;
    }

    if (verbose) {
      console.log(`[Importer] Processing game: ${igdbGame.name} (IGDB ID: ${igdbGame.id})`);
    }

    const supabase = createScriptClient();

    // Check if game already exists
    const { data: existingGame, error: checkError } = await supabase
      .from("games")
      .select("id, slug")
      .eq("igdb_id", igdbGame.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error(`[Importer] Error checking existing game:`, checkError);
    }

    if (existingGame) {
      return syncExistingGame(existingGame.id, existingGame.slug, igdbGame.id, verbose);
    }

    // Transform game data (sync, no I/O)
    const gameData = transformIGDBToSupabase(igdbGame);

    // Run related entities + color extraction in parallel (both independent)
    const [relatedEntities, colors] = await Promise.all([
      ensureRelatedEntities(igdbGame, verbose),
      gameData.cover_image_url
        ? extractColorsFromCover(gameData.cover_image_url, verbose)
        : Promise.resolve(null),
    ]);

    if (colors) {
      gameData.background_color = colors.background_color;
      gameData.accent_color = colors.accent_color;
      gameData.label_color = colors.label_color;
      gameData.text_color = colors.text_color;
    }

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

    // Parallelize all independent Supabase writes that only need gameId
    const writeOps: Promise<unknown>[] = [
      createTranslations(newGame.id, igdbGame),
      createMedia(newGame.id, igdbGame),
      createVideos(newGame.id, igdbGame, verbose),
      createLanguages(newGame.id, igdbGame),
      createAgeRatings(newGame.id, igdbGame, verbose),
    ];

    if (relatedEntities.genreIds.length > 0) {
      writeOps.push(linkGenres(newGame.id, relatedEntities.genreIds));
    }
    if (relatedEntities.developerIds.length > 0) {
      writeOps.push(linkCompanies(newGame.id, relatedEntities.developerIds, "developer"));
    }
    if (relatedEntities.publisherIds.length > 0) {
      writeOps.push(linkCompanies(newGame.id, relatedEntities.publisherIds, "publisher"));
    }

    writeOps.push(
      ensurePlatforms(igdbGame, verbose).then((platformIds) =>
        platformIds.length > 0 ? linkPlatforms(newGame.id, platformIds) : undefined
      )
    );

    await Promise.all(writeOps);

    // Parallelize the 3 remaining IGDB-dependent operations
    await Promise.all([
      fetchAndSavePlaytime(newGame.id, igdbGame.id, verbose),
      importGameVersions(newGame.id, igdbGame.id, verbose, dryRun),
      importDlcExtensions(newGame.id, igdbGame, verbose, dryRun),
      importSimilarGames(newGame.id, igdbGame, verbose),
    ]);

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
    ? toDateString(igdbGame.first_release_date)
    : null;

  const metascore = igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null;

  return {
    slug: igdbGame.slug,
    igdb_id: igdbGame.id,
    release_date: releaseDate,
    metascore,
    cover_image_url: coverUrl,
    background_image_url: backgroundUrl,
    background_color: null as string | null,
    accent_color: null as string | null,
    label_color: null as string | null,
    text_color: null as string | null,
    last_synced_at: new Date().toISOString(),
    playtime_hastily: null,
    playtime_normally: null,
    playtime_completely: null,
    playtime_updated_at: null,
  };
}

/** Safely convert a Unix timestamp (seconds) to YYYY-MM-DD, returning null on invalid dates */
function toDateString(timestamp: number): string | null {
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
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

  // Only create English translation — IGDB data is English only
  await supabase
    .from("genre_translations")
    .insert([{ genre_id: genreId, language_code: "en", name }]);
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

  // Only create English translation — IGDB data is English only
  await supabase
    .from("game_translations")
    .insert([{ game_id: gameId, language_code: "en", title: igdbGame.name, description }]);
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
      url: IGDBService.buildImageUrl(ss.image_id, "1080p"),
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

async function createVideos(gameId: string, igdbGame: IGDBGame, verbose: boolean): Promise<void> {
  if (!igdbGame.videos || igdbGame.videos.length === 0) {
    return;
  }

  try {
    const supabase = createScriptClient();
    const videoRows = transformIgdbVideos(igdbGame.videos, gameId);

    const { error } = await supabase.from("game_videos").insert(videoRows);

    if (error) {
      console.error(`[Importer] Failed to insert videos:`, error.message);
      return;
    }

    if (verbose) {
      console.log(`[Importer] Imported ${videoRows.length} videos`);
    }
  } catch (error) {
    console.error(
      `[Importer] Error importing videos:`,
      error instanceof Error ? error.message : error
    );
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
      nativeName: string;
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
    const langNativeName = ls.language.native_name || ls.language.name || langCode;

    const existing = languageMap.get(langCode) || {
      name: langName,
      nativeName: langNativeName,
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

  const langs = Array.from(languageMap.values());

  if (langs.length > 0) {
    // Ensure all languages exist in supported_languages reference table
    const supportedRows = langs.map((l) => ({
      code: l.code,
      name: l.name,
      native_name: l.nativeName,
    }));
    const { error: upsertErr } = await supabase
      .from("supported_languages")
      .upsert(supportedRows, { onConflict: "code", ignoreDuplicates: true });
    if (upsertErr) {
      console.warn("[game-importer] Failed to upsert supported_languages:", upsertErr);
    }

    // Fetch back canonical names from supported_languages
    const codes = langs.map((l) => l.code);
    const { data: supportedLangs } = await supabase
      .from("supported_languages")
      .select("code, name")
      .in("code", codes);

    const nameMap = new Map((supportedLangs ?? []).map((sl) => [sl.code, sl.name]));

    const languageEntries = langs.map((lang) => ({
      game_id: gameId,
      language_code: lang.code,
      language_name: nameMap.get(lang.code) ?? lang.name,
      has_audio: lang.hasAudio,
      has_subtitles: lang.hasSubtitles,
      has_interface: lang.hasInterface,
    }));

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

      const { error } = await (
        supabase.from("game_versions") as ReturnType<typeof supabase.from>
      ).upsert(
        {
          game_id: gameId,
          igdb_id: version.id,
          version_title: version.version_title || version.name,
          description: version.summary || null,
          cover_image_url: coverUrl,
          display_order: i,
        } as Record<string, unknown>,
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

/**
 * Imports DLC, expansions and bundles from IGDB for a given game.
 * Follows the same pattern as importGameVersions.
 *
 * @param gameId The UUID of the game in our database
 * @param igdbGame The full IGDB game object (contains dlcs/expansions/bundles arrays)
 * @param verbose Whether to log verbose output
 * @param dryRun If true, don't write to database
 * @returns Number of DLC/extensions imported
 */
export async function importDlcExtensions(
  gameId: string,
  igdbGame: IGDBGame,
  verbose: boolean,
  dryRun: boolean = false
): Promise<number> {
  try {
    // Collect tagged IDs from dlcs/expansions/bundles fields
    const taggedIds = collectDlcExtensionIds(igdbGame);

    if (taggedIds.length === 0) {
      if (verbose) {
        console.log(`[Importer] No DLC/extensions found for game: ${igdbGame.name}`);
      }
      return 0;
    }

    if (verbose) {
      console.log(`[Importer] Found ${taggedIds.length} DLC/extensions for game: ${igdbGame.name}`);
    }

    // Fetch details from IGDB
    const allIds = taggedIds.map((t) => t.id);
    const igdbExtensions = await IGDBService.getDlcExtensions(allIds);

    if (igdbExtensions.length === 0) {
      if (verbose) {
        console.log(`[Importer] No DLC/extension details returned from IGDB`);
      }
      return 0;
    }

    if (dryRun) {
      if (verbose) {
        console.log(`[Importer] Dry-run: Would import ${igdbExtensions.length} DLC/extensions`);
        for (const ext of igdbExtensions) {
          console.log(`[Importer]   - ${ext.name}`);
        }
      }
      return igdbExtensions.length;
    }

    // Build a lookup map from ID → source category
    const categoryMap = new Map(taggedIds.map((t) => [t.id, t.sourceCategory]));

    const supabase = createScriptClient();
    let importedCount = 0;

    for (let i = 0; i < igdbExtensions.length; i++) {
      const ext = igdbExtensions[i];
      const sourceCategory = categoryMap.get(ext.id) ?? "dlc";
      const row = transformIgdbToDlcExtensionRow(ext, gameId, sourceCategory, i);

      const { error } = await (
        supabase.from("game_dlc_extensions") as ReturnType<typeof supabase.from>
      ).upsert(row as unknown as Record<string, unknown>, {
        onConflict: "game_id,igdb_id",
      });

      if (!error) {
        importedCount++;
      } else if (verbose) {
        console.log(`[Importer] Error importing DLC/extension ${ext.name}:`, error.message);
      }
    }

    if (verbose) {
      console.log(`[Importer] Imported ${importedCount} DLC/extensions for game`);
    }

    return importedCount;
  } catch (error) {
    if (verbose) {
      console.error(`[Importer] Error importing DLC/extensions for game ${igdbGame.name}:`, error);
    }
    return 0;
  }
}

/**
 * Imports similar games from IGDB for a given game.
 * Stores IGDB IDs and resolves local game references when available.
 */
async function importSimilarGames(
  gameId: string,
  igdbGame: IGDBGame,
  verbose: boolean
): Promise<void> {
  if (!igdbGame.similar_games || igdbGame.similar_games.length === 0) {
    return;
  }

  try {
    const supabase = createScriptClient();

    // Resolve which similar games already exist locally
    const { data: localGames } = await supabase
      .from("games")
      .select("id, igdb_id")
      .in("igdb_id", igdbGame.similar_games);

    const localMap = new Map(
      (localGames ?? [])
        .filter((g): g is typeof g & { igdb_id: number } => g.igdb_id !== null)
        .map((g) => [g.igdb_id, g.id])
    );

    const rows = igdbGame.similar_games.map((similarIgdbId, i) => ({
      game_id: gameId,
      similar_igdb_id: similarIgdbId,
      similar_game_id: localMap.get(similarIgdbId) ?? null,
      display_order: i,
    }));

    const { error } = await supabase
      .from("game_similar_games")
      .upsert(rows, { onConflict: "game_id,similar_igdb_id" });

    if (error) {
      if (verbose) console.error(`[Importer] Error importing similar games:`, error.message);
    } else if (verbose) {
      console.log(
        `[Importer] Imported ${rows.length} similar games (${localMap.size} resolved locally)`
      );
    }
  } catch (error) {
    if (verbose) {
      console.error(`[Importer] Error importing similar games:`, error);
    }
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
