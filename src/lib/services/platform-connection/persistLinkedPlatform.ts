import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import type {
  PlatformConnectionAdapter,
  PlatformCredentials,
  PlatformProfile,
} from "@/types/platform-connection";

type LinkedPlatformInsert = Database["public"]["Tables"]["player_linked_platforms"]["Insert"];

export function tokenExpiresAt(
  credentials: Pick<PlatformCredentials, "accessToken" | "expiresIn">,
  defaultExpiresIn: number | null,
  now: number = Date.now()
): string | null {
  if (!credentials.accessToken) return null;
  const lifetime = credentials.expiresIn ?? defaultExpiresIn;
  if (lifetime === null) return null;
  return new Date(now + lifetime * 1000).toISOString();
}

export function buildLinkedPlatformRow(
  playerId: string,
  adapter: PlatformConnectionAdapter,
  credentials: PlatformCredentials,
  profile: PlatformProfile,
  now: number = Date.now()
): LinkedPlatformInsert {
  return {
    player_id: playerId,
    platform: adapter.platform,
    auth_type: adapter.authType,
    external_id: profile.externalId,
    platform_username: profile.username,
    platform_avatar_url: profile.avatarUrl ?? null,
    platform_metadata: profile.metadata ?? null,
    platform_region: profile.region ?? null,
    access_token: encryptPlatformTokenOrNull(credentials.accessToken),
    refresh_token: encryptPlatformTokenOrNull(credentials.refreshToken),
    token_expires_at: tokenExpiresAt(credentials, adapter.defaultExpiresIn, now),
    updated_at: new Date(now).toISOString(),
  };
}

export async function persistLinkedPlatform(
  supabase: SupabaseClient<Database>,
  row: LinkedPlatformInsert
): Promise<{ message: string } | null> {
  const { error } = await supabase
    .from("player_linked_platforms")
    .upsert(row, { onConflict: "player_id,platform" });
  return error ? { message: error.message } : null;
}
