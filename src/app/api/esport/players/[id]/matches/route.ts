import { NextRequest, NextResponse } from "next/server";
import { getPlayerRecentMatches } from "@/lib/services/esportPlayerMatchesService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (page !== undefined && (isNaN(page) || page < 1)) {
      return NextResponse.json({ error: "Invalid 'page' parameter" }, { status: 400 });
    }
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return NextResponse.json({ error: "Invalid 'limit' parameter" }, { status: 400 });
    }

    const result = await getPlayerRecentMatches(playerId, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error in esport player matches API", { error });
    return NextResponse.json({ error: "Failed to fetch player matches" }, { status: 500 });
  }
}
