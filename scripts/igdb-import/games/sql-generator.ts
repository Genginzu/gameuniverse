/**
 * SQL Generator for IGDB Game Dump Import.
 *
 * Takes assembled IGDBGame objects and generates a SQL file with INSERT statements
 * for all game-related tables. Designed to be executed directly in Supabase.
 */

import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type { IGDBGame } from "../../../src/types/igdb";
import { IGDBService } from "../../../src/lib/services/igdbService";
import { IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS } from "../../../src/types/igdb";
import {
  esc,
  num,
  toDate,
  collectGenres,
  collectCompanies,
  collectPlatforms,
  collectRatings,
  collectLanguages,
  generateGenresSql,
  generateCompaniesSql,
  generatePlatformsSql,
  generateRatingSystemsSql,
  generateSupportedLanguagesSql,
  type GenreEntry,
  type CompanyEntry,
  type PlatformEntry,
  type RatingEntry,
  type LanguageEntry,
} from "./sql-entities";

/**
 * Generate a single SQL file from assembled IGDBGame objects.
 */
export async function generateGamesSql(
  games: IGDBGame[],
  outputPath: string,
  verbose: boolean
): Promise<void> {
  console.log(`[SQLGen] Generating SQL for ${games.length} games...`);

  const genreMap = new Map<string, GenreEntry>();
  const companyMap = new Map<string, CompanyEntry>();
  const platformMap = new Map<number, PlatformEntry>();
  const ratingSystemSet = new Set<string>();
  const ratingMap = new Map<string, RatingEntry>();
  const languageMap = new Map<string, LanguageEntry>();

  for (const game of games) {
    collectGenres(game, genreMap);
    collectCompanies(game, companyMap);
    collectPlatforms(game, platformMap);
    collectRatings(game, ratingSystemSet, ratingMap);
    collectLanguages(game, languageMap);
  }

  if (verbose) {
    console.log(
      `[SQLGen] Entities: ${genreMap.size} genres, ${companyMap.size} companies, ${platformMap.size} platforms`
    );
  }

  await mkdir(dirname(outputPath), { recursive: true });

  const lines: string[] = [
    "-- IGDB Game Dump Import",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Games: ${games.length}`,
    "",
    "BEGIN;",
    "",
    ...generateGenresSql(genreMap),
    ...generateCompaniesSql(companyMap),
    ...generatePlatformsSql(platformMap),
    ...generateRatingSystemsSql(ratingSystemSet, ratingMap),
    ...generateSupportedLanguagesSql(languageMap),
  ];

  for (let i = 0; i < games.length; i++) {
    lines.push(...generateSingleGameSql(games[i]));
    if (verbose && (i + 1) % 10000 === 0) {
      console.log(`[SQLGen] Processed ${i + 1}/${games.length} games`);
    }
  }

  lines.push("", "COMMIT;", "");
  await writeFile(outputPath, lines.join("\n"), "utf-8");
  console.log(`[SQLGen] SQL written to ${outputPath} (${lines.length} lines)`);
}

/** Generate all INSERT statements for a single game and its related data */
function generateSingleGameSql(game: IGDBGame): string[] {
  const lines: string[] = [];
  const igdbId = num(game.id);

  // Cover & background URLs
  const coverUrl = game.cover?.image_id
    ? IGDBService.buildImageUrl(game.cover.image_id, "cover_big")
    : null;
  let bgUrl: string | null = null;
  if (game.artworks?.[0]?.image_id)
    bgUrl = IGDBService.buildImageUrl(game.artworks[0].image_id, "1080p");
  else if (game.screenshots?.[0]?.image_id)
    bgUrl = IGDBService.buildImageUrl(game.screenshots[0].image_id, "1080p");

  const metascore = game.aggregated_rating ? num(Math.round(game.aggregated_rating)) : "NULL";

  // Game row
  lines.push(
    `INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES (${esc(game.slug)}, ${igdbId}, ${toDate(game.first_release_date)}, ${metascore}, ${esc(coverUrl)}, ${esc(bgUrl)}, NOW()) ON CONFLICT (igdb_id) DO NOTHING;`
  );

  // Translation
  const desc = game.summary || game.storyline || null;
  lines.push(
    `INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', ${esc(game.name)}, ${esc(desc)} FROM games WHERE igdb_id = ${igdbId} ON CONFLICT (game_id, language_code) DO NOTHING;`
  );

  // Genres
  for (const g of game.genres ?? []) {
    lines.push(
      `INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = ${igdbId} AND ge.slug = ${esc(g.slug)} ON CONFLICT DO NOTHING;`
    );
  }

  // Companies
  for (const ic of game.involved_companies ?? []) {
    const role = ic.developer ? "developer" : "publisher";
    lines.push(
      `INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, ${esc(role)}, false FROM games g, companies c WHERE g.igdb_id = ${igdbId} AND c.slug = ${esc(ic.company.slug)} ON CONFLICT DO NOTHING;`
    );
  }

  // Platforms
  for (const p of game.platforms ?? []) {
    lines.push(
      `INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = ${igdbId} AND p.igdb_id = ${num(p.id)} ON CONFLICT DO NOTHING;`
    );
  }

  // Screenshots
  for (let i = 0; i < (game.screenshots?.length ?? 0); i++) {
    const url = IGDBService.buildImageUrl(game.screenshots![i].image_id, "1080p");
    lines.push(
      `INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, ${esc(url)}, ${i}, ${i === 0} FROM games WHERE igdb_id = ${igdbId} ON CONFLICT DO NOTHING;`
    );
  }

  // Artworks
  for (let i = 0; i < (game.artworks?.length ?? 0); i++) {
    const url = IGDBService.buildImageUrl(game.artworks![i].image_id, "1080p");
    lines.push(
      `INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, ${esc(url)}, 'promotional', ${i}, ${i === 0} FROM games WHERE igdb_id = ${igdbId} ON CONFLICT DO NOTHING;`
    );
  }

  // Videos
  for (let i = 0; i < (game.videos?.length ?? 0); i++) {
    const v = game.videos![i];
    const url = `https://www.youtube.com/watch?v=${v.video_id}`;
    const thumb = `https://img.youtube.com/vi/${v.video_id}/maxresdefault.jpg`;
    lines.push(
      `INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, ${esc(url)}, ${esc(thumb)}, ${esc(v.name || "Trailer")}, 'trailer', ${i}, ${i === 0} FROM games WHERE igdb_id = ${igdbId} ON CONFLICT DO NOTHING;`
    );
  }

  // Age ratings
  for (const ar of game.age_ratings ?? []) {
    const systemCode =
      ar.organization !== undefined ? IGDB_RATING_CATEGORIES[ar.organization] : undefined;
    if (!systemCode) continue;
    const ratingInfo =
      ar.rating_category !== undefined ? IGDB_ALL_RATINGS[ar.rating_category] : undefined;
    const ratingCode = ratingInfo?.code ?? String(ar.rating_category);
    lines.push(
      `INSERT INTO game_ratings (game_id, rating_id, is_primary) SELECT g.id, r.id, false FROM games g, ratings r JOIN rating_systems rs ON r.rating_system_id = rs.id WHERE g.igdb_id = ${igdbId} AND rs.code = ${esc(systemCode)} AND r.code = ${esc(ratingCode)} ON CONFLICT DO NOTHING;`
    );
  }

  // Languages
  if (game.language_supports?.length) {
    const langMap = new Map<string, { name: string; audio: boolean; subs: boolean; ui: boolean }>();
    for (const ls of game.language_supports) {
      const code = ls.language?.locale?.split("-")[0]?.toLowerCase();
      if (!code) continue;
      const e = langMap.get(code) ?? {
        name: ls.language.name || code,
        audio: false,
        subs: false,
        ui: false,
      };
      const st = ls.language_support_type?.name?.toLowerCase() ?? "";
      if (st.includes("audio")) e.audio = true;
      else if (st.includes("subtitle")) e.subs = true;
      else if (st.includes("interface")) e.ui = true;
      langMap.set(code, e);
    }
    for (const [code, lang] of langMap) {
      lines.push(
        `INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, ${esc(code)}, ${esc(lang.name)}, ${lang.audio}, ${lang.subs}, ${lang.ui} FROM games WHERE igdb_id = ${igdbId} ON CONFLICT DO NOTHING;`
      );
    }
  }

  return lines;
}
