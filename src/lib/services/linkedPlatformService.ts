import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { GAMING_PLATFORMS, type LinkedPlatform, type GamingPlatform, type AuthType } from "@/types/linked-platforms";

type FullRow = Database["public"]["Tables"]["player_linked_platforms"]["Row"];
type DbRow = Pick<
  FullRow,
  | "id"
  | "player_id"
  | "platform"
  | "platform_username"
  | "platform_avatar_url"
  | "auth_type"
  | "external_id"
  | "token_expires_at"
  | "is_public"
  | "created_at"
  | "updated_at"
>;

const SELECT_COLS_FULL =
  "id, player_id, platform, platform_username, platform_avatar_url, auth_type, external_id, token_expires_at, is_public, created_at, updated_at";
const SELECT_COLS_LEGACY =
  "id, player_id, platform, platform_username, auth_type, external_id, token_expires_at, created_at, updated_at";

type LegacyDbRow = Pick<
  FullRow,
  | "id"
  | "player_id"
  | "platform"
  | "platform_username"
  | "auth_type"
  | "external_id"
  | "token_expires_at"
  | "created_at"
  | "updated_at"
>;

function toLinkedPlatform(
  row: DbRow | LegacyDbRow,
  lastSyncedAt: string | null = null
): LinkedPlatform {
  const full = row as Partial<DbRow>;
  return {
    id: row.id,
    playerId: row.player_id,
    platform: row.platform as GamingPlatform,
    platformUsername: row.platform_username,
    platformAvatarUrl: full.platform_avatar_url ?? null,
    authType: row.auth_type as AuthType,
    externalId: row.external_id,
    tokenExpiresAt: row.token_expires_at,
    isPublic: full.is_public ?? true,
    lastSyncedAt,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

async function fetchLastSyncedByPlatform(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<Map<string, string>> {
  const latest = new Map<string, string>();
  try {
    const { data, error } = await supabase
      .from("user_library")
      .select("source_platform, synced_at")
      .eq("user_id", playerId)
      .not("source_platform", "is", null)
      .not("synced_at", "is", null);

    // Gracefully handle environments where the library-sync columns
    // (source_platform / synced_at) have not been migrated yet.
    if (error) return latest;

    for (const row of data ?? []) {
      if (!row.source_platform || !row.synced_at) continue;
      const existing = latest.get(row.source_platform);
      if (!existing || existing < row.synced_at) {
        latest.set(row.source_platform, row.synced_at);
      }
    }
  } catch {
    // Ignore: absence of library-sync columns shouldn't break profile settings.
  }
  return latest;
}

export async function getLinkedPlatforms(
  supabase: SupabaseClient<Database>,
  playerId: string
): Promise<LinkedPlatform[]> {
  const primary = await supabase
    .from("player_linked_platforms")
    .select(SELECT_COLS_FULL)
    .eq("player_id", playerId)
    .order("platform");

  // Retry with a legacy projection if the newer columns (platform_avatar_url / is_public)
  // are not yet deployed to the database this code is connected to.
  let data: DbRow[] | LegacyDbRow[] | null = primary.data;
  if (primary.error) {
    const legacy = await supabase
      .from("player_linked_platforms")
      .select(SELECT_COLS_LEGACY)
      .eq("player_id", playerId)
      .order("platform");
    if (legacy.error) throw legacy.error;
    data = legacy.data;
  }

  const lastSyncedMap = await fetchLastSyncedByPlatform(supabase, playerId);
  return (data ?? []).map((row) => toLinkedPlatform(row, lastSyncedMap.get(row.platform) ?? null));
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

  const upsertResult = await supabase
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
    .select(SELECT_COLS_FULL)
    .single();

  if (upsertResult.error) {
    // Retry with legacy columns in case newer ones aren't deployed yet.
    const legacy = await supabase
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
      .select(SELECT_COLS_LEGACY)
      .single();
    if (legacy.error) throw legacy.error;
    return toLinkedPlatform(legacy.data);
  }
  return toLinkedPlatform(upsertResult.data);
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

export async function setPlatformVisibility(
  supabase: SupabaseClient<Database>,
  playerId: string,
  platform: GamingPlatform,
  isPublic: boolean
): Promise<void> {
  const { error } = await supabase
    .from("player_linked_platforms")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("player_id", playerId)
    .eq("platform", platform);

  if (error) {
    // If the is_public column is missing, surface a clearer error so the
    // client can prompt the user to run migrations instead of looping on 500s.
    throw new Error(
      error.message.includes("is_public")
        ? "Visibility feature requires migration 20260417000005"
        : error.message
    );
  }
}
