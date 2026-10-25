/**
 * Games of a franchise in the admin (`/api/admin/franchises/[id]/games`).
 * Linking or unlinking a game is a manual edit of its `franchises` field:
 * an override is recorded so IGDB syncs keep the admin choice.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { upsertFieldOverrides, type SupabaseClientLike } from "@/lib/utils/field-tracking";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { AdminFranchiseGame } from "@/types/admin-franchises";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

interface LinkRow {
  games: {
    id: string;
    slug: string;
    cover_image_url: string | null;
    release_date: string | null;
    game_translations: Array<{ title: string; language_code: string }>;
  } | null;
}

export async function listAdminFranchiseGames(
  supabase: Client,
  franchiseId: string,
  locale: string
): Promise<AdminFranchiseGame[]> {
  const { data, error } = await untypedTable(supabase, "game_franchises")
    .select("games(id, slug, cover_image_url, release_date, game_translations(title, language_code))")
    .eq("franchise_id", franchiseId);
  if (error) throw new Error(`game_franchises: ${error.message}`);
  return ((data ?? []) as unknown as LinkRow[])
    .map((row) => row.games)
    .filter((game): game is NonNullable<LinkRow["games"]> => Boolean(game))
    .map((game) => {
      const translations = game.game_translations ?? [];
      const title =
        translations.find((tr) => tr.language_code === locale)?.title ?? translations[0]?.title ?? game.slug;
      return {
        id: game.id,
        slug: game.slug,
        title,
        coverImage: game.cover_image_url,
        releaseDate: game.release_date,
      };
    })
    .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"));
}

async function recordOverride(supabase: Client, gameId: string, userId: string) {
  await upsertFieldOverrides(supabase as unknown as SupabaseClientLike, gameId, ["franchises"], userId);
}

export async function addAdminFranchiseGame(
  supabase: Client,
  franchiseId: string,
  gameId: string,
  userId: string
): Promise<void> {
  const { error } = await untypedTable(supabase, "game_franchises").upsert(
    { franchise_id: franchiseId, game_id: gameId },
    { onConflict: "game_id,franchise_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(`game_franchises: ${error.message}`);
  await recordOverride(supabase, gameId, userId);
}

export async function removeAdminFranchiseGame(
  supabase: Client,
  franchiseId: string,
  gameId: string,
  userId: string
): Promise<void> {
  const { error } = await untypedTable(supabase, "game_franchises")
    .delete()
    .eq("franchise_id", franchiseId)
    .eq("game_id", gameId);
  if (error) throw new Error(`game_franchises: ${error.message}`);
  await recordOverride(supabase, gameId, userId);
}
