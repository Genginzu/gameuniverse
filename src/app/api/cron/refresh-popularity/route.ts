import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { refreshPopularity } from "@/lib/services/popularityRefreshService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { bearerToken, safeEqual } from "@/lib/utils/safeEqual";

export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    safeEqual(bearerToken(request.headers.get("authorization")), secret) ||
    safeEqual(request.headers.get("x-cron-secret"), secret)
  );
}

export const GET = handler;
export const POST = handler;

/** Weekly job: refreshes IGDB popularity, imports missing top games, recomputes trending. */
async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await refreshPopularity(getSupabaseAdmin());
    logger.info("cron refresh-popularity done", { ...report });
    return NextResponse.json(report);
  } catch (error) {
    logger.error("cron refresh-popularity failed", { error });
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
