import { NextRequest, NextResponse } from "next/server";
import { getPlayerStats } from "@/lib/services/esportPlayerHistoryService";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const stats = await getPlayerStats(playerId);
    return NextResponse.json({ stats });
  } catch (error) {
    logger.error("Error in esport player stats API", { error });
    return NextResponse.json({ error: "Failed to fetch player stats" }, { status: 500 });
  }
}
