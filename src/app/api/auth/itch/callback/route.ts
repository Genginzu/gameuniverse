import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { encryptPlatformTokenOrNull } from "@/lib/services/platformTokens";
import { consumeOauthState } from "@/lib/services/oauthState";

const ITCH_ME_URL = "https://itch.io/api/1/key/me";

interface ItchUser {
  username: string;
  id: number;
  cover_url?: string | null;
}

/**
 * itch.io uses the OAuth 2.0 implicit flow: the access token is delivered
 * in the URL fragment (#access_token=...&state=...), which the server
 * cannot see. This GET returns a small bootstrap page that reads the
 * fragment and re-POSTs to the same endpoint with the token in the body.
 */
export async function GET() {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>itch.io</title></head><body>
<script>
  (function () {
    var params = new URLSearchParams(location.hash.slice(1));
    fetch(location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: params.get("access_token"),
        state: params.get("state"),
      }),
    }).then(function () { location.replace("/"); });
  })();
</script>
Connecting to itch.io...
</body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { access_token, state } = (await request.json()) as {
      access_token?: string;
      state?: string;
    };

    const stateValid = await consumeOauthState("itch", state ?? null);
    if (!stateValid) {
      return NextResponse.json({ error: "State mismatch" }, { status: 400 });
    }
    if (!access_token) {
      return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
    }

    const res = await fetch(ITCH_ME_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "itch profile fetch failed" }, { status: 502 });
    }
    const data = (await res.json()) as { user?: ItchUser };
    const itchUser = data.user;
    if (!itchUser) {
      return NextResponse.json({ error: "Missing itch user" }, { status: 502 });
    }

    await supabase.from("player_linked_platforms").upsert(
      {
        player_id: user.id,
        platform: "itch",
        auth_type: "oauth",
        external_id: String(itchUser.id),
        platform_username: itchUser.username,
        platform_avatar_url: itchUser.cover_url ?? null,
        access_token: encryptPlatformTokenOrNull(access_token),
        refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,platform" }
    );

    return NextResponse.json({
      success: true,
      redirect: `${baseUrl}/players/${user.id}?tab=settings&platform=itch&success=true`,
    });
  } catch (error) {
    logger.error("itch.io callback error", { error });
    return NextResponse.json({ error: "itch callback failed" }, { status: 500 });
  }
}
