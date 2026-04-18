import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { exchangeRefreshTokenForAuthTokens } from "psn-api";
import type { GamingPlatform } from "@/types/linked-platforms";
import {
  decryptPlatformToken,
  encryptPlatformToken,
  encryptPlatformTokenOrNull,
} from "./platformTokens";
import { logger } from "@/lib/logger";

const EXPIRY_GRACE_MS = 60_000;

type Row = Database["public"]["Tables"]["player_linked_platforms"]["Row"];

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

async function refreshXboxToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const res = await fetch("https://login.live.com/oauth20_token.srf", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.XBOX_CLIENT_ID!,
      client_secret: process.env.XBOX_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "XboxLive.signin XboxLive.offline_access",
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(`Xbox refresh failed: ${data.error_description ?? data.error ?? "unknown"}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? 3600,
  };
}

async function refreshPsnToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const authorization = await exchangeRefreshTokenForAuthTokens(refreshToken);
  return {
    accessToken: authorization.accessToken,
    refreshToken: authorization.refreshToken ?? null,
    expiresIn: authorization.expiresIn ?? 3600,
  };
}

/**
 * Return a valid (fresh) access token for the given player's linked platform.
 * Decrypts the stored token, refreshes it if expired, and persists the new token.
 * Returns null when the platform is not connected or cannot be refreshed.
 */
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

  if (!isExpired(data.token_expires_at)) {
    try {
      return decryptPlatformToken(data.access_token);
    } catch (err) {
      logger.error("Failed to decrypt platform token", { platform, playerId, err });
      return null;
    }
  }

  if (!data.refresh_token) return null;

  let plainRefresh: string;
  try {
    plainRefresh = decryptPlatformToken(data.refresh_token);
  } catch (err) {
    logger.error("Failed to decrypt refresh token", { platform, playerId, err });
    return null;
  }

  let refreshed: { accessToken: string; refreshToken: string | null; expiresIn: number };
  try {
    if (platform === "xbox") {
      refreshed = await refreshXboxToken(plainRefresh);
    } else if (platform === "playstation") {
      refreshed = await refreshPsnToken(plainRefresh);
    } else {
      return null;
    }
  } catch (err) {
    logger.error("Platform token refresh failed", { platform, playerId, err });
    return null;
  }

  const tokenExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
  const update: Partial<Row> = {
    access_token: encryptPlatformToken(refreshed.accessToken),
    refresh_token: encryptPlatformTokenOrNull(refreshed.refreshToken) ?? data.refresh_token,
    token_expires_at: tokenExpiresAt,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("player_linked_platforms")
    .update(update)
    .eq("id", data.id);

  if (updateError) {
    logger.error("Failed to persist refreshed platform token", { platform, playerId, updateError });
  }

  return refreshed.accessToken;
}
