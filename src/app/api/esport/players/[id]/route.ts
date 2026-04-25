import { NextRequest, NextResponse } from "next/server";
import { getPlayerDetail } from "@/lib/services/esportPlayerService";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const player = await getPlayerDetail(playerId);
    return NextResponse.json({ player });
  } catch (error) {
    logger.error("Error in esport player detail API", { error });
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}
