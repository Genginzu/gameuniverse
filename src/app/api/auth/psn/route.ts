import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getProfileFromAccountId,
} from "psn-api";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { npsso } = await request.json();
    if (!npsso?.trim()) {
      return NextResponse.json({ error: "NPSSO token is required" }, { status: 400 });
    }

    // Exchange NPSSO → access code → auth tokens
    const accessCode = await exchangeNpssoForAccessCode(npsso.trim());
    const authorization = await exchangeAccessCodeForAuthTokens(accessCode);

    // The accountId is encoded as `sub` in the idToken JWT returned by PSN
    const accountId = decodeJwtSub(authorization.idToken);
    if (!accountId) {
      return NextResponse.json({ error: "Failed to resolve PSN account id" }, { status: 400 });
    }

    // Get PSN profile to retrieve onlineId
    const profile = await getProfileFromAccountId(authorization, "me");

    const tokenExpiresAt = new Date(
      Date.now() + (authorization.expiresIn ?? 3600) * 1000
    ).toISOString();

    await supabase.from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "playstation",
        auth_type: "npsso",
        external_id: accountId,
        platform_username: profile.onlineId,
        access_token: encryptPlatformTokenOrNull(authorization.accessToken),
        refresh_token: encryptPlatformTokenOrNull(authorization.refreshToken ?? null),
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.json({
      success: true,
      username: profile.onlineId,
      accountId,
    });
  } catch (error) {
    logger.error("PSN auth error", { error });
    const message = error instanceof Error ? error.message : "PSN authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function decodeJwtSub(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    const parsed = JSON.parse(payload) as { sub?: string };
    return parsed.sub ?? null;
  } catch {
    return null;
  }
}
