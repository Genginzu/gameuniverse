/**
 * Game Dump Assembler.
 *
 * Reads the downloaded IGDB CSV dumps and assembles them into IGDBGame objects
 * by joining the related tables (covers, genres, platforms, etc.).
 * The output matches the same shape as the API response used by the existing importer.
 */

import { buildLookupMap, parseCsvFile } from "../shared/dump-csv-parser";
import type { IGDBGame } from "../../../src/types/igdb";
import type {
  RawGame,
  RawCover,
  RawScreenshot,
  RawArtwork,
  RawGenre,
  RawPlatform,
  RawVideo,
  RawAgeRating,
  RawInvolvedCompany,
  RawCompany,
  RawLanguageSupport,
  RawLanguage,
  RawLanguageSupportType,
} from "./dump-types";

/** All lookup maps needed to assemble a game */
interface GameLookups {
  covers: Map<number, RawCover>;
  screenshots: Map<number, RawScreenshot>;
  artworks: Map<number, RawArtwork>;
  genres: Map<number, RawGenre>;
  platforms: Map<number, RawPlatform>;
  videos: Map<number, RawVideo>;
  ageRatings: Map<number, RawAgeRating>;
  involvedCompanies: Map<number, RawInvolvedCompany>;
  companies: Map<number, RawCompany>;
  languageSupports: Map<number, RawLanguageSupport>;
  languages: Map<number, RawLanguage>;
  languageSupportTypes: Map<number, RawLanguageSupportType>;
}

/**
 * Load all CSV dumps and assemble IGDBGame objects.
 * @param csvPaths Map of endpoint name → local CSV file path
 * @param verbose Enable logging
 */
export async function assembleGamesFromDumps(
  csvPaths: Map<string, string>,
  verbose: boolean
): Promise<IGDBGame[]> {
  console.log("[DumpAssembler] Loading CSV files into memory...");

  const empty = <T>(): Promise<Map<number, T>> => Promise.resolve(new Map());
  const load = <T>(key: string) =>
    csvPaths.has(key) ? buildLookupMap<T>(csvPaths.get(key)!) : empty<T>();

  const [
    rawGames,
    covers,
    screenshots,
    artworks,
    genres,
    platforms,
    videos,
    ageRatings,
    involvedCompanies,
    companies,
    languageSupports,
    languages,
    languageSupportTypes,
  ] = await Promise.all([
    parseCsvFile<RawGame>(csvPaths.get("games")!),
    load<RawCover>("covers"),
    load<RawScreenshot>("screenshots"),
    load<RawArtwork>("artworks"),
    load<RawGenre>("genres"),
    load<RawPlatform>("platforms"),
    load<RawVideo>("game_videos"),
    load<RawAgeRating>("age_ratings"),
    load<RawInvolvedCompany>("involved_companies"),
    load<RawCompany>("companies"),
    load<RawLanguageSupport>("language_supports"),
    load<RawLanguage>("languages"),
    load<RawLanguageSupportType>("language_support_types"),
  ]);

  const lookups: GameLookups = {
    covers,
    screenshots,
    artworks,
    genres,
    platforms,
    videos,
    ageRatings,
    involvedCompanies,
    companies,
    languageSupports,
    languages,
    languageSupportTypes,
  };

  if (verbose) console.log(`[DumpAssembler] Loaded ${rawGames.length} raw games`);

  // Filter to main games only (same filter as API mode)
  const validGameTypes = new Set([0, 4, 8, 9, 10]);
  const filtered = rawGames.filter((g) => validGameTypes.has(g.game_type ?? g.category ?? 0));

  if (verbose) console.log(`[DumpAssembler] ${filtered.length} games after type filter`);

  const games = filtered.map((raw) => assembleGame(raw, lookups));
  console.log(`[DumpAssembler] Assembled ${games.length} games from dumps`);
  return games;
}

/** Assemble a single IGDBGame from raw CSV data + lookup maps */
function assembleGame(raw: RawGame, l: GameLookups): IGDBGame {
  const cover = raw.cover ? l.covers.get(raw.cover) : undefined;

  const screenshots = resolveIds(raw.screenshots, l.screenshots).map((s) => ({
    image_id: s.image_id,
  }));
  const artworks = resolveIds(raw.artworks, l.artworks).map((a) => ({ image_id: a.image_id }));
  const genres = resolveIds(raw.genres, l.genres).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
  }));
  const platforms = resolveIds(raw.platforms, l.platforms).map((p) => ({ id: p.id, name: p.name }));
  const videos = resolveIds(raw.videos, l.videos).map((v) => ({
    video_id: v.video_id,
    name: v.name,
  }));

  const ageRatings = resolveIds(raw.age_ratings, l.ageRatings).map((ar) => ({
    id: ar.id,
    organization: ar.organization,
    rating_category: ar.rating_category,
    synopsis: ar.synopsis,
  }));

  const involvedCompanies = resolveIds(raw.involved_companies, l.involvedCompanies).map((ic) => {
    const company = ic.company ? l.companies.get(ic.company) : undefined;
    return {
      company: {
        id: company?.id ?? ic.company ?? 0,
        name: company?.name ?? "Unknown",
        slug: company?.slug ?? "unknown",
      },
      developer: Boolean(ic.developer),
      publisher: Boolean(ic.publisher),
    };
  });

  const languageSupports = resolveIds(raw.language_supports, l.languageSupports).map((ls) => {
    const lang = ls.language ? l.languages.get(ls.language) : undefined;
    const st = ls.language_support_type
      ? l.languageSupportTypes.get(ls.language_support_type)
      : undefined;
    return {
      language: {
        id: lang?.id ?? 0,
        name: lang?.name ?? "",
        native_name: lang?.native_name ?? "",
        locale: lang?.locale ?? "",
      },
      language_support_type: { id: st?.id ?? 0, name: st?.name ?? "" },
    };
  });

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    summary: raw.summary as string | undefined,
    storyline: raw.storyline as string | undefined,
    first_release_date: parseTimestamp(raw.first_release_date),
    game_type: raw.game_type ?? raw.category,
    aggregated_rating: raw.aggregated_rating as number | undefined,
    cover: cover ? { image_id: cover.image_id } : undefined,
    screenshots: orUndef(screenshots),
    artworks: orUndef(artworks),
    genres: orUndef(genres),
    platforms: orUndef(platforms),
    videos: orUndef(videos),
    age_ratings: orUndef(ageRatings),
    involved_companies: orUndef(involvedCompanies),
    language_supports: orUndef(languageSupports),
    dlcs: asNumberArray(raw.dlcs),
    expansions: asNumberArray(raw.expansions),
    bundles: asNumberArray(raw.bundles),
    // Fields used by isNotableGame filter (not in IGDBGame type, accessed via cast)
    total_rating_count: raw.total_rating_count,
    aggregated_rating_count: raw.aggregated_rating_count,
    hypes: raw.hypes,
    follows: raw.follows,
  } as IGDBGame;
}

function resolveIds<T>(ids: unknown, map: Map<number, T>): T[] {
  if (!ids || !Array.isArray(ids)) return [];
  return ids
    .map(Number)
    .filter((id) => !isNaN(id) && map.has(id))
    .map((id) => map.get(id)!);
}

function orUndef<T>(arr: T[]): T[] | undefined {
  return arr.length > 0 ? arr : undefined;
}

function asNumberArray(val: unknown): number[] | undefined {
  if (!val || !Array.isArray(val)) return undefined;
  const nums = val.map(Number).filter((n) => !isNaN(n));
  return nums.length > 0 ? nums : undefined;
}

/**
 * Convert a CSV timestamp to Unix seconds.
 * IGDB dumps use "YYYY-MM-DD HH:MM:SS" format, but the API uses Unix timestamps.
 */
function parseTimestamp(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  // Already a number (Unix timestamp)
  if (typeof val === "number") return val;
  // String datetime "2000-06-29 00:00:00"
  if (typeof val === "string") {
    const d = new Date(val.replace(" ", "T") + "Z");
    if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
  }
  return undefined;
}
