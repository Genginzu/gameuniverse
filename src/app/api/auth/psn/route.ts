import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
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

    // Get PSN profile to retrieve username and accountId
    const profile = await getProfileFromAccountId(authorization, "me");

    const tokenExpiresAt = new Date(
      Date.now() + (authorization.expiresIn ?? 3600) * 1000
    ).toISOString();

    await supabase.from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "playstation",
        auth_type: "npsso",
        external_id: profile.accountId,
        platform_username: profile.onlineId,
        access_token: authorization.accessToken,
        refresh_token: authorization.refreshToken ?? null,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.json({
      success: true,
      username: profile.onlineId,
      accountId: profile.accountId,
    });
  } catch (error) {
    logger.error("PSN auth error", { error });
    const message = error instanceof Error ? error.message : "PSN authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
