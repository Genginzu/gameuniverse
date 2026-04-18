import { NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";

const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;
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
