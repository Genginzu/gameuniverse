import { NextRequest, NextResponse } from "next/server";
import { issueOauthState } from "@/lib/services/oauthState";
import { issueOauthReturn } from "@/lib/services/oauthReturn";
import { STEAM_OPENID_URL, steamReturnUrl } from "@/lib/services/steamOpenId";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  await issueOauthReturn(request.nextUrl.searchParams.get("returnTo"));
  const state = await issueOauthState("steam");
  const returnUrl = steamReturnUrl(baseUrl, state);

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
