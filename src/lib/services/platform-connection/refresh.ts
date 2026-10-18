import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import {
  decryptPlatformToken,
  encryptPlatformToken,
  encryptPlatformTokenOrNull,
} from "@/lib/services/platformTokens";
import type { GamingPlatform } from "@/types/linked-platforms";
import type { PlatformCredentials } from "@/types/platform-connection";
import { getConnectionAdapter } from "./adapters";
import { tokenExpiresAt } from "./persistLinkedPlatform";

const EXPIRY_GRACE_MS = 60_000;
const DEFAULT_REFRESHED_LIFETIME = 3600;

interface RefreshableRow {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  return Number.isNaN(expiry) || expiry - Date.now() < EXPIRY_GRACE_MS;
}

function decryptOrNull(payload: string, label: string, context: Record<string, string>) {
  try {
    return decryptPlatformToken(payload);
  } catch (err) {
    logger.error(`Failed to decrypt ${label}`, { ...context, err });
    return null;
  }
}

async function refreshCredentials(
  platform: GamingPlatform,
  refreshToken: string
): Promise<PlatformCredentials | null> {
  const adapter = getConnectionAdapter(platform);
  if (!adapter?.refresh) return null;
  const refreshed = await adapter.refresh(refreshToken);
  if (!refreshed.accessToken) throw new Error(`${platform} refresh returned no access token`);
  return {
    ...refreshed,
    expiresIn: refreshed.expiresIn ?? adapter.defaultExpiresIn ?? DEFAULT_REFRESHED_LIFETIME,
  };
}

export async function getValidAccessToken(
  supabase: SupabaseClient<Database>,
  playerId: string,
  platform: GamingPlatform
): Promise<string | null> {
  const { data, error } = await supabase
    .from("player_linked_platforms")
    .select("id, access_token, refresh_token, token_expires_at")
    .eq("player_id", playerId)
    .eq("platform", platform)
    .maybeSingle<RefreshableRow>();

  if (error) throw error;
  if (!data?.access_token) return null;

  const context = { platform, playerId };
  if (!isExpired(data.token_expires_at)) {
    return decryptOrNull(data.access_token, "platform token", context);
  }
  if (!data.refresh_token) return null;

  const plainRefresh = decryptOrNull(data.refresh_token, "refresh token", context);
  if (!plainRefresh) return null;

  let refreshed: PlatformCredentials | null;
  try {
    refreshed = await refreshCredentials(platform, plainRefresh);
  } catch (err) {
    logger.error("Platform token refresh failed", { ...context, err });
    return null;
  }
  if (!refreshed?.accessToken) return null;

  const { error: updateError } = await supabase
    .from("player_linked_platforms")
    .update({
      access_token: encryptPlatformToken(refreshed.accessToken),
      refresh_token: encryptPlatformTokenOrNull(refreshed.refreshToken) ?? data.refresh_token,
      token_expires_at: tokenExpiresAt(refreshed, null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    logger.error("Failed to persist refreshed platform token", { ...context, updateError });
  }

  return refreshed.accessToken;
}
