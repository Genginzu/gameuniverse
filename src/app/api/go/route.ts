import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { resolveAffiliateRedirect } from "@/lib/services/affiliateRedirectService";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NO_INDEX_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer-when-downgrade",
};

async function getOptionalPlayerId(): Promise<string | null> {
  try {
    const supabase = await createRouteHandlerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * GET /api/go?price=<game_price_id>
 * Logs an affiliate click then 302-redirects to the (affiliated) store product URL.
 * Only URLs stored on game_prices and belonging to an active store domain are reachable.
 */
export async function GET(request: NextRequest) {
  try {
    const priceId = request.nextUrl.searchParams.get("price");
    const result = await resolveAffiliateRedirect(getSupabaseAdmin(), priceId, {
      playerId: await getOptionalPlayerId(),
      referrer: request.headers.get("referer"),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason },
        { status: result.status, headers: NO_INDEX_HEADERS }
      );
    }

    return NextResponse.redirect(result.url, { status: 302, headers: NO_INDEX_HEADERS });
  } catch (error) {
    logger.error("Error in affiliate redirect", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: NO_INDEX_HEADERS }
    );
  }
}
