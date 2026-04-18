import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { issueOauthState } from "@/lib/services/oauthState";

const BATTLENET_AUTHORIZE_URL = "https://oauth.battle.net/authorize";
const ALLOWED_REGIONS = new Set(["us", "eu", "kr", "tw"]);

export async function GET(request: NextRequest) {
  const clientId = process.env.BATTLENET_CLIENT_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/battlenet/callback`;

  const requestedRegion = request.nextUrl.searchParams.get("region")?.toLowerCase() ?? "eu";
  const region = ALLOWED_REGIONS.has(requestedRegion) ? requestedRegion : "eu";

  const state = await issueOauthState("battlenet");

  // Persist the region selection alongside the state so the callback can recover it.
  const store = await cookies();
  store.set({
    name: "oauth_region_battlenet",
    value: region,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid",
    state,
  });

  return NextResponse.redirect(`${BATTLENET_AUTHORIZE_URL}?${params.toString()}`);
}
