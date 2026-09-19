import { NextRequest, NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";
import { issueOauthReturn } from "@/lib/services/oauthReturn";

const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;
  await issueOauthReturn(request.nextUrl.searchParams.get("returnTo"));
  const state = await issueOauthState("discord");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify connections",
    state,
    prompt: "consent",
  });

  return NextResponse.redirect(`${DISCORD_AUTHORIZE_URL}?${params.toString()}`);
}
