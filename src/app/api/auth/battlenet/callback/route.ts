import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import { consumeOauthState } from "@/lib/services/oauthState";

const BATTLENET_TOKEN_URL = "https://oauth.battle.net/token";
const BATTLENET_USERINFO_URL = "https://oauth.battle.net/userinfo";

interface BattleNetTokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface BattleNetUserInfo {
  sub: string;
  id?: number;
  battletag?: string;
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<BattleNetTokenResponse> {
  const basic = Buffer.from(
    `${process.env.BATTLENET_CLIENT_ID}:${process.env.BATTLENET_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(BATTLENET_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  return res.json();
}

async function getUserInfo(accessToken: string): Promise<BattleNetUserInfo | null> {
  const res = await fetch(BATTLENET_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.redirect(`${baseUrl}/auth?error=unauthorized`);

    const stateValid = await consumeOauthState("battlenet", state);
    if (!stateValid) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=battlenet_state_mismatch`);
    }
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=battlenet_no_code`);
    }

    const cookieStore = await cookies();
    const region = cookieStore.get("oauth_region_battlenet")?.value ?? "eu";
    cookieStore.delete("oauth_region_battlenet");

    const redirectUri = `${baseUrl}/api/auth/battlenet/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=battlenet_token_failed`);
    }

    const userInfo = await getUserInfo(tokenData.access_token);
    if (!userInfo?.sub) {
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=battlenet_profile_failed`);
    }

    const expiresIn = tokenData.expires_in ?? 86400;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "battlenet",
        auth_type: "oauth",
        external_id: userInfo.sub,
        platform_username: userInfo.battletag ?? null,
        platform_region: region,
        access_token: encryptPlatformTokenOrNull(tokenData.access_token),
        refresh_token: null,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&platform=battlenet&success=true`);
  } catch (error) {
    logger.error("Battle.net callback error", { error });
    return NextResponse.redirect(`${baseUrl}?error=battlenet_callback_failed`);
  }
}
