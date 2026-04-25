import { NextRequest, NextResponse } from "next/server";
import { getPlayerGameRanks } from "@/lib/services/gameRankService";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // In a real implementation, fetch linked accounts from the database
    // For now, return empty ranks since no accounts are linked yet
    const linkedAccounts: Array<{ game: string; accountId: string }> = [];

    const ranks = await getPlayerGameRanks(linkedAccounts);
    return NextResponse.json({ playerId: id, ranks });
  } catch (error) {
    logger.error("Error fetching game ranks", { error });
    return NextResponse.json({ error: "Failed to fetch game ranks" }, { status: 500 });
  }
}
