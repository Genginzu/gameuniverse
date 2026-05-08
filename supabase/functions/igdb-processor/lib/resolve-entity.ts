/**
 * Resolves the local Supabase row for an IGDB entity referenced by an event.
 *
 * For `games` and `characters`, lookup is by `igdb_id`.
 * For `popularity_primitives`, the related game ID lives in payload.game_id
 * (not in payload.id which is the primitive row's own ID).
 */

import { getSupabaseAdmin } from "../../_shared/supabase-admin.ts";

export interface ResolvedEntity {
  gameId: string | null;
  characterId: string | null;
}

export async function resolveLocalEntity(
  entityType: string,
  igdbId: number,
  popularityGameIgdbId: number | null = null,
): Promise<ResolvedEntity> {
  const supabase = getSupabaseAdmin();

  if (entityType === "games") {
    const { data } = await supabase
      .from("games")
      .select("id")
      .eq("igdb_id", igdbId)
      .single();
    return { gameId: (data?.id as string) ?? null, characterId: null };
  }

  if (entityType === "characters") {
    const { data } = await supabase
      .from("characters")
      .select("id")
      .eq("igdb_id", igdbId)
      .single();
    return { gameId: null, characterId: (data?.id as string) ?? null };
  }

  if (entityType === "popularity_primitives" && popularityGameIgdbId !== null) {
    const { data } = await supabase
      .from("games")
      .select("id")
      .eq("igdb_id", popularityGameIgdbId)
      .single();
    return { gameId: (data?.id as string) ?? null, characterId: null };
  }

  return { gameId: null, characterId: null };
}
