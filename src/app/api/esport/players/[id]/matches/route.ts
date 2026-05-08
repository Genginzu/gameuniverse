import { NextRequest, NextResponse } from "next/server";
import { getPlayerRecentMatches } from "@/lib/services/esportPlayerMatchesService";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const matches = await getPlayerRecentMatches(playerId);
    return NextResponse.json({ matches });
  } catch (error) {
    logger.error("Error in esport player matches API", { error });
    return NextResponse.json({ error: "Failed to fetch player matches" }, { status: 500 });
  }
}
