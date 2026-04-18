import { NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const state = await issueOauthState("steam");
  const returnUrl = `${baseUrl}/api/auth/steam/callback?state=${state}`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": baseUrl,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}
