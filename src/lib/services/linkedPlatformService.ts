import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { GAMING_PLATFORMS, type LinkedPlatform, type GamingPlatform, type AuthType } from "@/types/linked-platforms";

type DbRow = Database["public"]["Tables"]["player_linked_platforms"]["Row"];

function toLinkedPlatform(row: DbRow): LinkedPlatform {
  return {
    id: row.id,
    playerId: row.player_id,
    platform: row.platform as GamingPlatform,
    platformUsername: row.platform_username,
    authType: row.auth_type as AuthType,
    externalId: row.external_id,
    tokenExpiresAt: row.token_expires_at,
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
    .select("id, player_id, platform, platform_username, auth_type, external_id, token_expires_at, created_at, updated_at")
    .eq("player_id", playerId)
    .order("platform");

  if (error) throw error;
  return (data ?? []).map(toLinkedPlatform);
}

export async function upsertManualPlatform(
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
        auth_type: "manual" as const,
        platform_username: platformUsername.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    )
    .select("id, player_id, platform, platform_username, auth_type, external_id, token_expires_at, created_at, updated_at")
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
