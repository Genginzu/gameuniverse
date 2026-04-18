import { NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";

export async function GET() {
  const clientId = process.env.XBOX_CLIENT_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/xbox/callback`;
  const state = await issueOauthState("xbox");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "XboxLive.signin XboxLive.offline_access",
    state,
  });

  return NextResponse.redirect(
    `https://login.live.com/oauth20_authorize.srf?${params.toString()}`
  );
}
