import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { consumeOauthState } from "@/lib/services/oauthState";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

async function verifySteamLogin(params: URLSearchParams): Promise<string | null> {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  const text = await res.text();
  if (!text.includes("is_valid:true")) return null;

  const claimedId = params.get("openid.claimed_id") ?? "";
  const match = claimedId.match(STEAM_ID_REGEX);
  return match?.[1] ?? null;
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

    const stateValid = await consumeOauthState("steam", params.get("state"));
    if (!stateValid) {
      return NextResponse.redirect(
        `${baseUrl}/players/${user.id}?tab=settings&error=steam_state_mismatch`
      );
    }

    const steamId = await verifySteamLogin(params);
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

    await supabase.from("player_linked_platforms").upsert(
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

    return NextResponse.redirect(
      `${baseUrl}/players/${user.id}?tab=settings&platform=steam&success=true`
    );
  } catch (error) {
    logger.error("Steam callback error", { error });
    return NextResponse.redirect(`${baseUrl}?error=steam_callback_failed`);
  }
}
