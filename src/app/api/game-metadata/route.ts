import { NextRequest, NextResponse } from "next/server";

import { parseArrayParam } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { fetchMetadataFilterOptions } from "@/lib/services/gameMetadataFilters";
import { createRouteHandlerClient } from "@/lib/supabase-server";

/**
 * GET /api/game-metadata?engines=a,b&franchises=c — options of the games
 * listing metadata filters (themes, modes, perspectives) and names of the
 * requested engine / franchise slugs. Public catalogue data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createRouteHandlerClient();
    const options = await fetchMetadataFilterOptions(supabase, {
      engines: parseArrayParam(searchParams.get("engines")),
      franchises: parseArrayParam(searchParams.get("franchises")),
    });
    return NextResponse.json(options, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    logger.error("Error in game metadata filters API", { error });
    return NextResponse.json({ error: "Failed to fetch game metadata" }, { status: 500 });
  }
}
