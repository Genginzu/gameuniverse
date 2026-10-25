import { NextRequest, NextResponse } from "next/server";

import { parsePaginationParams } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { listFranchises } from "@/lib/services/franchiseService";
import { createRouteHandlerClient } from "@/lib/supabase-server";

/** GET /api/franchises?search=&page=&limit= — franchises and IGDB collections, most popular first. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").slice(0, 100);
    const { page, limit } = parsePaginationParams(searchParams, { maxLimit: 100 });
    const supabase = await createRouteHandlerClient();
    return NextResponse.json(await listFranchises(supabase, { search, page, limit }));
  } catch (error) {
    logger.error("Error in franchises API", { error });
    return NextResponse.json({ error: "Failed to fetch franchises" }, { status: 500 });
  }
}
