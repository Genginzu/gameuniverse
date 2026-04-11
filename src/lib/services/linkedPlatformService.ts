import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { GAMING_PLATFORMS, type LinkedPlatform, type GamingPlatform } from "@/types/linked-platforms";

type DbRow = Database["public"]["Tables"]["player_linked_platforms"]["Row"];

function toLinkedPlatform(row: DbRow): LinkedPlatform {
  return {
    id: row.id,
    playerId: row.player_id,
    platform: row.platform as GamingPlatform,
    platformUsername: row.platform_username,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

export async function getLinkedPlatforms(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<LinkedPlatform[]> {
  const { data, error } = await supabase
    .from("player_linked_platforms")
    .select("*")
    .eq("player_id", playerId)
    .order("platform");

  if (error) throw error;
  return (data ?? []).map(toLinkedPlatform);
}

export async function upsertLinkedPlatform(
  supabase: SupabaseClient<Database>,
  playerId: string,
  platform: GamingPlatform,
  platformUsername: string
): Promise<LinkedPlatform> {
  if (!GAMING_PLATFORMS.includes(platform)) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  const { data, error } = await supabase
    .from("player_linked_platforms")
    .upsert(
      {
        player_id: playerId,
        platform,
        platform_username: platformUsername.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    )
    .select()
    .single();

  if (error) throw error;
  return toLinkedPlatform(data);
}

export async function deleteLinkedPlatform(
  supabase: SupabaseClient<Database>,
  playerId: string,
  platform: GamingPlatform
): Promise<void> {
  const { error } = await supabase
    .from("player_linked_platforms")
    .delete()
    .eq("player_id", playerId)
    .eq("platform", platform);

  if (error) throw error;
}
