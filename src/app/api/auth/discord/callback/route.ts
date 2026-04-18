import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import { consumeOauthState } from "@/lib/services/oauthState";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";
const DISCORD_CONNECTIONS_URL = "https://discord.com/api/users/@me/connections";

interface DiscordTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<DiscordTokenResponse> {
  const res = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  return res.json();
}

async function getDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  const res = await fetch(DISCORD_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getDiscordConnections(accessToken: string): Promise<Array<{
  type: string; id: string; name: string; verified?: boolean;
}>> {
  const res = await fetch(DISCORD_CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function buildAvatarUrl(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.redirect(`${baseUrl}/auth?error=unauthorized`);

    const stateValid = await consumeOauthState("discord", state);
    if (!stateValid) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=discord_state_mismatch`);
    }
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=discord_no_code`);
    }

    const redirectUri = `${baseUrl}/api/auth/discord/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=discord_token_failed`);
    }

    const discordUser = await getDiscordUser(tokenData.access_token);
    if (!discordUser) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=discord_profile_failed`);
    }

    const connections = await getDiscordConnections(tokenData.access_token);

    const expiresIn = tokenData.expires_in ?? 604800;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const displayName = discordUser.global_name ?? discordUser.username;

    await supabase.from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "discord",
        auth_type: "oauth",
        external_id: discordUser.id,
        platform_username: displayName,
        platform_avatar_url: buildAvatarUrl(discordUser),
        platform_metadata: { connections },
        access_token: encryptPlatformTokenOrNull(tokenData.access_token),
        refresh_token: encryptPlatformTokenOrNull(tokenData.refresh_token ?? null),
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&platform=discord&success=true`);
  } catch (error) {
    logger.error("Discord callback error", { error });
    return NextResponse.redirect(`${baseUrl}?error=discord_callback_failed`);
  }
}
