/**
 * Genres, companies and platforms management for IGDB imports.
 * Deno port of src/lib/services/game-import/entities.ts.
 */

import { getSupabaseAdmin } from "../supabase-admin.ts";
import { logger } from "../logger.ts";
import type { IGDBGame } from "../igdb-types.ts";

export interface RelatedEntities {
  genreIds: string[];
  developerIds: string[];
  publisherIds: string[];
}

export async function ensureRelatedEntities(igdbGame: IGDBGame): Promise<RelatedEntities> {
  const genreIds = await ensureGenres(igdbGame.genres ?? []);
  const { developerIds, publisherIds } = await ensureCompanies(
    igdbGame.involved_companies ?? [],
  );
  return { genreIds, developerIds, publisherIds };
}

async function ensureGenres(
  igdbGenres: Array<{ id: number; name: string; slug: string }>,
): Promise<string[]> {
  if (igdbGenres.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const genreIds: string[] = [];

  for (const igdbGenre of igdbGenres) {
    const { data: existing } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", igdbGenre.slug)
      .single();

    if (existing) {
      genreIds.push(existing.id as string);
      continue;
    }

    const { data: created, error } = await supabase
      .from("genres")
      .insert({ slug: igdbGenre.slug })
      .select("id")
      .single();

    if (created && !error) {
      const id = created.id as string;
      genreIds.push(id);
      await supabase.from("genre_translations").insert({
        genre_id: id,
        language_code: "en",
        name: igdbGenre.name,
      });
    } else {
      logger.error("Failed to create genre", { slug: igdbGenre.slug, error });
    }
  }

  return genreIds;
}

async function ensureCompanies(
  involvedCompanies: Array<{
    company: { id: number; name: string; slug: string };
    developer: boolean;
    publisher: boolean;
  }>,
): Promise<{ developerIds: string[]; publisherIds: string[] }> {
  const developerIds: string[] = [];
  const publisherIds: string[] = [];

  if (involvedCompanies.length === 0) {
    return { developerIds, publisherIds };
  }

  const supabase = getSupabaseAdmin();

  for (const ic of involvedCompanies) {
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", ic.company.slug)
      .single();

    let companyId: string;

    if (existing) {
      companyId = existing.id as string;
    } else {
      const { data: created, error } = await supabase
        .from("companies")
        .insert({
          name: ic.company.name,
          slug: ic.company.slug,
          company_type: ic.developer ? "developer" : ic.publisher ? "publisher" : null,
        })
        .select("id")
        .single();

      if (!created || error) {
        logger.error("Failed to create company", { name: ic.company.name, error });
        continue;
      }

      companyId = created.id as string;
    }

    if (ic.developer) developerIds.push(companyId);
    if (ic.publisher) publisherIds.push(companyId);
  }

  return { developerIds, publisherIds };
}

export async function linkGenres(gameId: string, genreIds: string[]): Promise<void> {
  if (genreIds.length === 0) return;
  const supabase = getSupabaseAdmin();
  const rows = genreIds.map((genreId) => ({ game_id: gameId, genre_id: genreId }));
  const { error } = await supabase.from("game_genres").insert(rows);
  if (error && !error.message?.includes("duplicate")) {
    logger.error("Error linking genres", { gameId, error });
  }
}

export async function linkCompanies(
  gameId: string,
  companyIds: string[],
  role: "developer" | "publisher",
): Promise<void> {
  if (companyIds.length === 0) return;
  const supabase = getSupabaseAdmin();
  const rows = companyIds.map((companyId, index) => ({
    game_id: gameId,
    company_id: companyId,
    role,
    is_primary: index === 0,
  }));
  const { error } = await supabase.from("game_companies").insert(rows);
  if (error && !error.message?.includes("duplicate")) {
    logger.error("Error linking companies", { gameId, role, error });
  }
}

export async function ensurePlatforms(igdbGame: IGDBGame): Promise<string[]> {
  if (!igdbGame.platforms || igdbGame.platforms.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const platformIds: string[] = [];

  for (const igdbPlatform of igdbGame.platforms) {
    const name = igdbPlatform.name || `platform-${igdbPlatform.id}`;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: existing } = await supabase
      .from("platforms")
      .select("id")
      .eq("igdb_id", igdbPlatform.id)
      .single();

    if (existing) {
      platformIds.push(existing.id as string);
      continue;
    }

    const { data: created, error } = await supabase
      .from("platforms")
      .insert({ slug, igdb_id: igdbPlatform.id })
      .select("id")
      .single();

    if (error || !created) {
      logger.error("Failed to create platform", { name, error });
      continue;
    }

    const id = created.id as string;
    platformIds.push(id);

    await supabase
      .from("platform_translations")
      .insert({ platform_id: id, language_code: "en", name });
  }

  return platformIds;
}

export async function linkPlatforms(gameId: string, platformIds: string[]): Promise<void> {
  if (platformIds.length === 0) return;

  const supabase = getSupabaseAdmin();
  const rows = platformIds.map((platformId) => ({
    game_id: gameId,
    platform_id: platformId,
  }));

  const { error } = await supabase.from("game_platforms").insert(rows);

  if (error && !error.message?.includes("duplicate")) {
    logger.error("Error linking platforms", { gameId, error });
  }
}

export async function syncPlatforms(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const platformIds = await ensurePlatforms(igdbGame);
  if (platformIds.length === 0) return;

  const supabase = getSupabaseAdmin();

  const { data: existingLinks } = await supabase
    .from("game_platforms")
    .select("platform_id")
    .eq("game_id", gameId);

  const existingIds = new Set(
    (existingLinks ?? []).map((l: { platform_id: string }) => l.platform_id),
  );
  const newIds = platformIds.filter((id) => !existingIds.has(id));
  if (newIds.length === 0) return;

  const rows = newIds.map((platformId) => ({ game_id: gameId, platform_id: platformId }));
  const { error } = await supabase.from("game_platforms").insert(rows);
  if (error) {
    logger.error("Error syncing platforms", { gameId, error });
  }
}
