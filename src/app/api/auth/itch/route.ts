import { NextRequest, NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";
import { issueOauthReturn } from "@/lib/services/oauthReturn";

const ITCH_AUTHORIZE_URL = "https://itch.io/user/oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.ITCH_CLIENT_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/itch/callback`;
  await issueOauthReturn(request.nextUrl.searchParams.get("returnTo"));
  const state = await issueOauthState("itch");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "token",
    redirect_uri: redirectUri,
    scope: "profile:me",
    state,
  });

  return NextResponse.redirect(`${ITCH_AUTHORIZE_URL}?${params.toString()}`);
}
