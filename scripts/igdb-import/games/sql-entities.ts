/**
 * SQL generators for reference entities (genres, companies, platforms, etc.).
 * Used by sql-generator.ts to produce INSERT statements for shared entities.
 */

import { IGDB_RATING_CATEGORIES, IGDB_ALL_RATINGS } from "../../../src/types/igdb";
import type { IGDBGame } from "../../../src/types/igdb";

/** Escape a string for SQL (single quotes) */
export function esc(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  const str = String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

/** Format a number or null for SQL */
export function num(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "NULL";
  return String(val);
}

/** Convert Unix timestamp to SQL date string or NULL */
export function toDate(timestamp: number | undefined): string {
  if (!timestamp) return "NULL";
  try {
    const d = new Date(timestamp * 1000);
    if (isNaN(d.getTime())) return "NULL";
    return esc(d.toISOString().split("T")[0]);
  } catch {
    return "NULL";
  }
}

/** Generate a slug from a name */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Collected entity types ---
export type GenreEntry = { slug: string; name: string };
export type CompanyEntry = { slug: string; name: string; type: string | null };
export type PlatformEntry = { igdbId: number; name: string; slug: string };
export type RatingEntry = {
  systemCode: string;
  code: string;
  displayName: string;
  minAge: number | null;
};
export type LanguageEntry = { code: string; name: string; nativeName: string };

// --- Entity collectors ---

export function collectGenres(game: IGDBGame, map: Map<string, GenreEntry>) {
  for (const g of game.genres ?? []) {
    if (!map.has(g.slug)) map.set(g.slug, { slug: g.slug, name: g.name });
  }
}

export function collectCompanies(game: IGDBGame, map: Map<string, CompanyEntry>) {
  for (const ic of game.involved_companies ?? []) {
    const c = ic.company;
    if (!map.has(c.slug)) {
      map.set(c.slug, {
        slug: c.slug,
        name: c.name,
        type: ic.developer ? "developer" : ic.publisher ? "publisher" : null,
      });
    }
  }
}

export function collectPlatforms(game: IGDBGame, map: Map<number, PlatformEntry>) {
  for (const p of game.platforms ?? []) {
    if (!map.has(p.id)) map.set(p.id, { igdbId: p.id, name: p.name, slug: slugify(p.name) });
  }
}

export function collectRatings(
  game: IGDBGame,
  systems: Set<string>,
  ratings: Map<string, RatingEntry>
) {
  for (const ar of game.age_ratings ?? []) {
    const systemCode =
      ar.organization !== undefined ? IGDB_RATING_CATEGORIES[ar.organization] : undefined;
    if (!systemCode) continue;
    systems.add(systemCode);
    const info =
      ar.rating_category !== undefined ? IGDB_ALL_RATINGS[ar.rating_category] : undefined;
    const key = `${systemCode}:${info?.code ?? ar.rating_category}`;
    if (!ratings.has(key)) {
      ratings.set(key, {
        systemCode,
        code: info?.code ?? String(ar.rating_category),
        displayName: info?.name ?? `${systemCode} ${ar.rating_category}`,
        minAge: info?.age ?? null,
      });
    }
  }
}

export function collectLanguages(game: IGDBGame, map: Map<string, LanguageEntry>) {
  for (const ls of game.language_supports ?? []) {
    const code = ls.language?.locale?.split("-")[0]?.toLowerCase();
    if (!code || map.has(code)) continue;
    map.set(code, {
      code,
      name: ls.language.name || code,
      nativeName: ls.language.native_name || ls.language.name || code,
    });
  }
}

// --- SQL generators for reference entities ---

export function generateGenresSql(map: Map<string, GenreEntry>): string[] {
  if (map.size === 0) return [];
  const lines = ["-- Genres"];
  for (const [, g] of map) {
    lines.push(`INSERT INTO genres (slug) VALUES (${esc(g.slug)}) ON CONFLICT (slug) DO NOTHING;`);
    lines.push(
      `INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', ${esc(g.name)} FROM genres WHERE slug = ${esc(g.slug)} ON CONFLICT (genre_id, language_code) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}

export function generateCompaniesSql(map: Map<string, CompanyEntry>): string[] {
  if (map.size === 0) return [];
  const lines = ["-- Companies"];
  for (const [, c] of map) {
    lines.push(
      `INSERT INTO companies (name, slug, company_type) VALUES (${esc(c.name)}, ${esc(c.slug)}, ${esc(c.type)}) ON CONFLICT (slug) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}

export function generatePlatformsSql(map: Map<number, PlatformEntry>): string[] {
  if (map.size === 0) return [];
  const lines = ["-- Platforms"];
  for (const [, p] of map) {
    lines.push(
      `INSERT INTO platforms (slug, igdb_id) VALUES (${esc(p.slug)}, ${num(p.igdbId)}) ON CONFLICT (igdb_id) DO NOTHING;`
    );
    lines.push(
      `INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', ${esc(p.name)} FROM platforms WHERE igdb_id = ${num(p.igdbId)} ON CONFLICT (platform_id, language_code) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}

export function generateRatingSystemsSql(
  systems: Set<string>,
  ratings: Map<string, RatingEntry>
): string[] {
  if (systems.size === 0) return [];
  const lines = ["-- Rating systems & ratings"];
  for (const code of systems) {
    lines.push(
      `INSERT INTO rating_systems (code, name) VALUES (${esc(code)}, ${esc(code)}) ON CONFLICT (code) DO NOTHING;`
    );
  }
  for (const [, r] of ratings) {
    lines.push(
      `INSERT INTO ratings (rating_system_id, code, display_name, minimum_age) SELECT id, ${esc(r.code)}, ${esc(r.displayName)}, ${num(r.minAge)} FROM rating_systems WHERE code = ${esc(r.systemCode)} ON CONFLICT (rating_system_id, code) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}

export function generateSupportedLanguagesSql(map: Map<string, LanguageEntry>): string[] {
  if (map.size === 0) return [];
  const lines = ["-- Supported languages"];
  for (const [, l] of map) {
    lines.push(
      `INSERT INTO supported_languages (code, name, native_name) VALUES (${esc(l.code)}, ${esc(l.name)}, ${esc(l.nativeName)}) ON CONFLICT (code) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}
