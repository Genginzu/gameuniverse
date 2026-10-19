import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import { consumeOauthState } from "@/lib/services/oauthState";
import { consumeOauthReturn, withParams } from "@/lib/services/oauthReturn";

const EPIC_TOKEN_URL = "https://api.epicgames.dev/epic/oauth/v2/token";
const EPIC_USERINFO_URL = "https://api.epicgames.dev/epic/oauth/v2/userInfo";

interface EpicTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  account_id?: string;
  error?: string;
  error_description?: string;
  // Epic services often return errors in their own shape:
  errorCode?: string;
  errorMessage?: string;
  message?: string;
}

interface EpicUserInfo {
  sub?: string;
  preferred_username?: string;
  display_name?: string;
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<EpicTokenResponse> {
  const basic = Buffer.from(
    `${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(EPIC_TOKEN_URL, {
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

  const rawText = await res.text();
  let data: EpicTokenResponse = {};
  try {
    data = JSON.parse(rawText) as EpicTokenResponse;
  } catch {
    /* non-JSON body */
  }

  // Normalize Epic's error shapes (errorCode/errorMessage) into OAuth fields.
  if (!data.error && data.errorCode) data.error = data.errorCode;
  if (!data.error_description && (data.errorMessage || data.message)) {
    data.error_description = data.errorMessage ?? data.message;
  }

  if (!res.ok || !data.access_token) {
    logger.error("Epic token exchange failed", {
      status: res.status,
      error: data.error,
      errorDescription: data.error_description,
      rawBody: rawText.slice(0, 500),
      hasClientId: !!process.env.EPIC_CLIENT_ID,
      hasClientSecret: !!process.env.EPIC_CLIENT_SECRET,
      redirectUri,
    });
  }
  return data;
}

async function getEpicUserInfo(accessToken: string): Promise<EpicUserInfo | null> {
  const res = await fetch(EPIC_USERINFO_URL, {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.redirect(`${baseUrl}/auth?error=unauthorized`);

    // Where to send the user back (the page they started from, e.g. Connections),
    // used for both success and error outcomes.
    const returnTo = await consumeOauthReturn();
    const dest = (params: Record<string, string>) =>
      returnTo
        ? `${baseUrl}${withParams(returnTo, params)}`
        : `${baseUrl}${withParams(`/players/${user.id}?tab=settings`, params)}`;

    const stateValid = await consumeOauthState("epic", state);
    if (!stateValid) {
      return NextResponse.redirect(dest({ error: "epic_state_mismatch" }));
    }
    if (!code) {
      return NextResponse.redirect(dest({ error: "epic_no_code" }));
    }

    const redirectUri = `${baseUrl}/api/auth/epic/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    if (!tokenData.access_token) {
      return NextResponse.redirect(
        dest({
          error: "epic_token_failed",
          ...(tokenData.error ? { reason: tokenData.error } : {}),
          ...(tokenData.error_description
            ? { detail: tokenData.error_description.slice(0, 160) }
            : {}),
        })
      );
    }

    const accountId = tokenData.account_id ?? null;
    let displayName: string | null = null;
    const userInfo = await getEpicUserInfo(tokenData.access_token);
    if (userInfo) {
      displayName = userInfo.display_name ?? userInfo.preferred_username ?? null;
    }

    const expiresIn = tokenData.expires_in ?? 7200;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Token columns are not writable/readable with the user client (migration
    // 20261018000013): persist them with the service role, scoped to user.id.
    await getSupabaseAdmin().from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "epic",
        auth_type: "oauth",
        external_id: accountId,
        platform_username: displayName,
        access_token: encryptPlatformTokenOrNull(tokenData.access_token),
        refresh_token: encryptPlatformTokenOrNull(tokenData.refresh_token ?? null),
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.redirect(dest({ platform: "epic", success: "true" }));
  } catch (error) {
    logger.error("Epic callback error", { error });
    return NextResponse.redirect(`${baseUrl}?error=epic_callback_failed`);
  }
}
