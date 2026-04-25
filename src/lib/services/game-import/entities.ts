import { IGDBGame } from "@/types/igdb";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { RelatedEntities } from "./types";

/**
 * Ensures all related entities (genres, companies) exist in the database.
 * Creates missing entities or returns IDs of existing ones.
 */
export async function ensureRelatedEntities(igdbGame: IGDBGame): Promise<RelatedEntities> {
  const genreIds = await ensureGenres(igdbGame.genres || []);
  const { developerIds, publisherIds } = await ensureCompanies(igdbGame.involved_companies || []);

  return { genreIds, developerIds, publisherIds };
}

/**
 * Ensures genres exist in the database, creating them if necessary.
 */
async function ensureGenres(
  igdbGenres: Array<{ id: number; name: string; slug: string }>
): Promise<string[]> {
  if (igdbGenres.length === 0) return [];

  const supabase = await createRouteHandlerClient();
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
        await createGenreTranslations(supabase, newGenre.id, igdbGenre.name);
      }
    }
  }

  return genreIds;
}

/**
 * Creates translations for a genre (EN only — IGDB data is English).
 */
async function createGenreTranslations(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  genreId: string,
  name: string
): Promise<void> {
  await supabase.from("genre_translations").insert({
    genre_id: genreId,
    language_code: "en",
    name,
  });
}

/**
 * Ensures companies exist in the database, creating them if necessary.
 */
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

  const supabase = await createRouteHandlerClient();

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
        logger.error("Failed to create company", { name: ic.company.name, error });
        continue;
      }

      companyId = newCompany.id;
    }

    if (ic.developer) developerIds.push(companyId);
    if (ic.publisher) publisherIds.push(companyId);
  }

  return { developerIds, publisherIds };
}

/**
 * Links genres to a game.
 */
export async function linkGenres(gameId: string, genreIds: string[]): Promise<void> {
  const supabase = await createRouteHandlerClient();

  const gameGenres = genreIds.map((genreId) => ({
    game_id: gameId,
    genre_id: genreId,
  }));

  await supabase.from("game_genres").insert(gameGenres);
}

/**
 * Links companies to a game with a specific role.
 */
export async function linkCompanies(
  gameId: string,
  companyIds: string[],
  role: "developer" | "publisher"
): Promise<void> {
  const supabase = await createRouteHandlerClient();

  const gameCompanies = companyIds.map((companyId, index) => ({
    game_id: gameId,
    company_id: companyId,
    role,
    is_primary: index === 0,
  }));

  await supabase.from("game_companies").insert(gameCompanies);
}

/**
 * Ensures all platforms from an IGDB game exist in the database.
 * Creates new platforms with EN translation if they don't exist yet.
 */
export async function ensurePlatforms(igdbGame: IGDBGame): Promise<string[]> {
  if (!igdbGame.platforms || igdbGame.platforms.length === 0) return [];

  const supabase = await createRouteHandlerClient();
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
      platformIds.push(existing.id);
      continue;
    }

    const { data: newPlatform, error } = await supabase
      .from("platforms")
      .insert({ slug, igdb_id: igdbPlatform.id })
      .select("id")
      .single();

    if (error || !newPlatform) {
      logger.error("Failed to create platform", { name, error });
      continue;
    }

    platformIds.push(newPlatform.id);

    await supabase
      .from("platform_translations")
      .insert({ platform_id: newPlatform.id, language_code: "en", name });
  }

  return platformIds;
}

/**
 * Links platforms to a game via game_platforms junction table.
 */
export async function linkPlatforms(gameId: string, platformIds: string[]): Promise<void> {
  if (platformIds.length === 0) return;

  const supabase = await createRouteHandlerClient();

  const rows = platformIds.map((platformId) => ({
    game_id: gameId,
    platform_id: platformId,
  }));

  const { error } = await supabase.from("game_platforms").insert(rows);

  if (error && !error.message?.includes("duplicate")) {
    logger.error("Error linking platforms", { gameId, error });
  }
}

/**
 * Syncs platforms for an existing game (superset: adds new, keeps existing).
 */
export async function syncPlatforms(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const platformIds = await ensurePlatforms(igdbGame);
  if (platformIds.length === 0) return;

  const supabase = await createRouteHandlerClient();

  const { data: existingLinks } = await supabase
    .from("game_platforms")
    .select("platform_id")
    .eq("game_id", gameId);

  const existingIds = new Set((existingLinks ?? []).map((l) => l.platform_id));
  const newIds = platformIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) return;

  const rows = newIds.map((platformId) => ({
    game_id: gameId,
    platform_id: platformId,
  }));

  const { error } = await supabase.from("game_platforms").insert(rows);

  if (error) {
    logger.error("Error syncing platforms", { gameId, error });
  }
}
