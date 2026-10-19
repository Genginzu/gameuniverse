import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { consumeOauthState } from "@/lib/services/oauthState";
import { consumeOauthReturn, withParams } from "@/lib/services/oauthReturn";
import {
  STEAM_OPENID_URL,
  isValidSteamVerification,
  parseSteamAssertion,
  steamReturnUrl,
} from "@/lib/services/steamOpenId";

async function verifySteamLogin(
  params: URLSearchParams,
  expectedReturnTo: string
): Promise<string | null> {
  const assertion = parseSteamAssertion(params, expectedReturnTo);
  if (!assertion) return null;

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: assertion.verifyBody.toString(),
  });
  const text = await res.text();
  return isValidSteamVerification(text) ? assertion.steamId : null;
}

interface SteamPlayerSummary {
  personaname: string;
  avatarfull?: string;
  loccountrycode?: string;
  profileurl?: string;
  timecreated?: number;
}

async function getSteamProfile(steamId: string): Promise<SteamPlayerSummary | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  );
  const data = await res.json();
  return data?.response?.players?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const params = request.nextUrl.searchParams;

  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/auth?error=unauthorized`);
    }

    const state = params.get("state");
    const stateValid = await consumeOauthState("steam", state);
    if (!stateValid || !state) {
      return NextResponse.redirect(
        `${baseUrl}/players/${user.id}?tab=settings&error=steam_state_mismatch`
      );
    }

    // The signed return_to must carry the cookie state: binds the assertion to this flow.
    const steamId = await verifySteamLogin(params, steamReturnUrl(baseUrl, state));
    if (!steamId) {
      return NextResponse.redirect(
        `${baseUrl}/players/${user.id}?tab=settings&error=steam_auth_failed`
      );
    }

    const profile = await getSteamProfile(steamId);

    const metadata = profile
      ? {
          country: profile.loccountrycode ?? null,
          profile_url: profile.profileurl ?? null,
          created_at: profile.timecreated ?? null,
        }
      : null;

    // Token columns are not writable/readable with the user client (migration
    // 20261018000013): persist them with the service role, scoped to user.id.
    await getSupabaseAdmin().from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "steam",
        auth_type: "oauth",
        external_id: steamId,
        platform_username: profile?.personaname ?? null,
        platform_avatar_url: profile?.avatarfull ?? null,
        platform_metadata: metadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    const returnTo = await consumeOauthReturn();
    return NextResponse.redirect(
      returnTo
        ? `${baseUrl}${withParams(returnTo, { platform: "steam", success: "true" })}`
        : `${baseUrl}/players/${user.id}?tab=settings&platform=steam&success=true`
    );
  } catch (error) {
    logger.error("Steam callback error", { error });
    return NextResponse.redirect(`${baseUrl}?error=steam_callback_failed`);
  }
}
