import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getFranchiseDetail } from "@/lib/services/franchiseService";
import { createRouteHandlerClient } from "@/lib/supabase-server";

/** GET /api/franchises/[slug]?locale= — a franchise (or IGDB collection) with its games in release order. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const locale = new URL(request.url).searchParams.get("locale") || "fr";
    const supabase = await createRouteHandlerClient();
    const franchise = await getFranchiseDetail(supabase, slug, locale);
    if (!franchise) return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
    return NextResponse.json(franchise);
  } catch (error) {
    logger.error("Error in franchise detail API", { error });
    return NextResponse.json({ error: "Failed to fetch franchise" }, { status: 500 });
  }
}
