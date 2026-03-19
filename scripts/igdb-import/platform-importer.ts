/**
 * Platform import helpers for the IGDB bulk import script.
 * Handles creating/upserting platforms and linking them to games.
 */

import { createScriptClient } from "./supabase-client";
import type { IGDBGame } from "../../src/types/igdb";

/**
 * Generates a URL-friendly slug from a platform name.
 * Lowercase, spaces replaced with hyphens, non-alphanumeric stripped.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensures all platforms from an IGDB game exist in the database.
 * Uses upsert by igdb_id to avoid duplicates. Creates EN translation for new platforms.
 *
 * @returns Array of platform UUIDs (from our DB) for the game's platforms
 */
export async function ensurePlatforms(igdbGame: IGDBGame, verbose: boolean): Promise<string[]> {
  if (!igdbGame.platforms || igdbGame.platforms.length === 0) {
    if (verbose) {
      console.log(`[Importer] No platforms for game: ${igdbGame.name}`);
    }
    return [];
  }

  const supabase = createScriptClient();
  const platformIds: string[] = [];

  for (const igdbPlatform of igdbGame.platforms) {
    const name = igdbPlatform.name || `platform-${igdbPlatform.id}`;
    const slug = generateSlug(name);

    // Try to find existing platform by igdb_id
    const { data: existing } = await supabase
      .from("platforms")
      .select("id")
      .eq("igdb_id", igdbPlatform.id)
      .single();

    if (existing) {
      platformIds.push(existing.id);
      if (verbose) {
        console.log(`[Importer] Platform exists: ${name} (igdb_id: ${igdbPlatform.id})`);
      }
      continue;
    }

    // Create new platform
    const { data: newPlatform, error } = await supabase
      .from("platforms")
      .insert({ slug, igdb_id: igdbPlatform.id })
      .select("id")
      .single();

    if (error || !newPlatform) {
      if (verbose) {
        console.log(`[Importer] Failed to create platform ${name}:`, error?.message);
      }
      continue;
    }

    platformIds.push(newPlatform.id);

    // Create English translation
    await supabase
      .from("platform_translations")
      .insert({ platform_id: newPlatform.id, language_code: "en", name });

    if (verbose) {
      console.log(`[Importer] Created platform: ${name} (slug: ${slug})`);
    }
  }

  if (verbose) {
    console.log(`[Importer] Platforms resolved: ${platformIds.length}`);
  }

  return platformIds;
}

/**
 * Creates game_platforms associations between a game and its platforms.
 * Skips duplicates silently (upsert-like via ignore on conflict).
 */
export async function linkPlatforms(gameId: string, platformIds: string[]): Promise<void> {
  if (platformIds.length === 0) return;

  const supabase = createScriptClient();

  const rows = platformIds.map((platformId) => ({
    game_id: gameId,
    platform_id: platformId,
  }));

  const { error } = await supabase.from("game_platforms").insert(rows);

  if (error) {
    // Ignore duplicate key errors — platform may already be linked
    if (!error.message?.includes("duplicate")) {
      console.warn(`[Importer] Error linking platforms:`, error.message);
    }
  }
}

/**
 * Syncs platforms for an existing game using superset behavior:
 * adds new platform associations without removing existing ones.
 *
 * @returns Number of new platform associations added
 */
export async function syncGamePlatforms(
  gameId: string,
  igdbGame: IGDBGame,
  verbose: boolean
): Promise<number> {
  // Ensure all platforms exist in DB
  const platformIds = await ensurePlatforms(igdbGame, verbose);

  if (platformIds.length === 0) {
    if (verbose) {
      console.log(`[Importer] No platforms to sync for game`);
    }
    return 0;
  }

  const supabase = createScriptClient();

  // Fetch existing platform associations
  const { data: existingLinks } = await supabase
    .from("game_platforms")
    .select("platform_id")
    .eq("game_id", gameId);

  const existingIds = new Set((existingLinks ?? []).map((link) => link.platform_id));

  // Only insert new associations (superset behavior)
  const newPlatformIds = platformIds.filter((id) => !existingIds.has(id));

  if (newPlatformIds.length === 0) {
    if (verbose) {
      console.log(`[Importer] All platforms already linked`);
    }
    return 0;
  }

  const rows = newPlatformIds.map((platformId) => ({
    game_id: gameId,
    platform_id: platformId,
  }));

  const { error } = await supabase.from("game_platforms").insert(rows);

  if (error) {
    if (verbose) {
      console.log(`[Importer] Error syncing platforms:`, error.message);
    }
    return 0;
  }

  if (verbose) {
    console.log(`[Importer] Added ${newPlatformIds.length} new platform associations`);
  }

  return newPlatformIds.length;
}
