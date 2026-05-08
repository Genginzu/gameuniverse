import { NextRequest, NextResponse } from "next/server";
import { getPlayerTeamHistory } from "@/lib/services/esportPlayerHistoryService";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const history = await getPlayerTeamHistory(playerId);
    return NextResponse.json({ history });
  } catch (error) {
    logger.error("Error in esport player team-history API", { error });
    return NextResponse.json({ error: "Failed to fetch team history" }, { status: 500 });
  }
}
