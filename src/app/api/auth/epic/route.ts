import { NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";

const EPIC_AUTHORIZE_URL = "https://www.epicgames.com/id/authorize";

export async function GET() {
  const clientId = process.env.EPIC_CLIENT_ID!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/epic/callback`;
  const state = await issueOauthState("epic");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "basic_profile",
    state,
  });

  return NextResponse.redirect(`${EPIC_AUTHORIZE_URL}?${params.toString()}`);
}
