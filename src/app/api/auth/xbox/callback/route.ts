import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import { consumeOauthState } from "@/lib/services/oauthState";

async function exchangeCodeForToken(code: string, redirectUri: string) {
  const res = await fetch("https://login.live.com/oauth20_token.srf", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.XBOX_CLIENT_ID!,
      client_secret: process.env.XBOX_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  return res.json();
}

async function getXboxUserToken(accessToken: string) {
  const res = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Properties: {
        AuthMethod: "RPS",
        SiteName: "user.auth.xboxlive.com",
        RpsTicket: `d=${accessToken}`,
      },
      RelyingParty: "http://auth.xboxlive.com",
      TokenType: "JWT",
    }),
  });
  return res.json();
}

async function getXstsToken(userToken: string) {
  const res = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Properties: { SandboxId: "RETAIL", UserTokens: [userToken] },
      RelyingParty: "http://xboxlive.com",
      TokenType: "JWT",
    }),
  });
  return res.json();
}

async function getXboxProfile(xstsToken: string, userHash: string) {
  const settings = "Gamertag,GameDisplayPicRaw,Gamerscore,AccountTier,PublicGamerpic";
  const res = await fetch(
    `https://profile.xboxlive.com/users/me/profile/settings?settings=${settings}`,
    {
      headers: {
        Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
        "x-xbl-contract-version": "2",
      },
    }
  );
  return res.json();
}

function pickXboxSetting(
  settings: Array<{ id: string; value: string }> | undefined,
  id: string
): string | null {
  return settings?.find((s) => s.id === id)?.value ?? null;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const code = request.nextUrl.searchParams.get("code");

  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.redirect(`${baseUrl}/auth?error=unauthorized`);
    if (!code)
      return NextResponse.redirect(`${baseUrl}/players/${user.id}?tab=settings&error=xbox_no_code`);

    const stateValid = await consumeOauthState("xbox", request.nextUrl.searchParams.get("state"));
    if (!stateValid) {
      return NextResponse.redirect(
        `${baseUrl}/players/${user.id}?tab=settings&error=xbox_state_mismatch`
      );
    }

    const redirectUri = `${baseUrl}/api/auth/xbox/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${baseUrl}/players/${user.id}?tab=settings&error=xbox_token_failed`
      );
    }

    const xblData = await getXboxUserToken(tokenData.access_token);
    const xstsData = await getXstsToken(xblData.Token);
    const userHash = xstsData.DisplayClaims?.xui?.[0]?.uhs;
    const xuid = xstsData.DisplayClaims?.xui?.[0]?.xid;

    let gamertag: string | null = null;
    let avatarUrl: string | null = null;
    let metadata: Record<string, string | null> | null = null;
    if (userHash && xstsData.Token) {
      const profileData = await getXboxProfile(xstsData.Token, userHash);
      const settings = profileData?.profileUsers?.[0]?.settings as
        | Array<{ id: string; value: string }>
        | undefined;
      gamertag = pickXboxSetting(settings, "Gamertag");
      avatarUrl = pickXboxSetting(settings, "GameDisplayPicRaw");
      metadata = {
        gamerscore: pickXboxSetting(settings, "Gamerscore"),
        account_tier: pickXboxSetting(settings, "AccountTier"),
      };
    }

    const expiresIn = tokenData.expires_in ?? 3600;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "xbox",
        auth_type: "oauth",
        external_id: xuid ?? null,
        platform_username: gamertag,
        platform_avatar_url: avatarUrl,
        platform_metadata: metadata,
        access_token: encryptPlatformTokenOrNull(tokenData.access_token),
        refresh_token: encryptPlatformTokenOrNull(tokenData.refresh_token ?? null),
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.redirect(
      `${baseUrl}/players/${user.id}?tab=settings&platform=xbox&success=true`
    );
  } catch (error) {
    logger.error("Xbox callback error", { error });
    return NextResponse.redirect(`${baseUrl}?error=xbox_callback_failed`);
  }
}
