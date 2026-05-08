import { NextRequest, NextResponse } from "next/server";
import { getLiveMatches } from "@/lib/services/esportLiveService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || undefined;

    const matches = await getLiveMatches({ game });
    return NextResponse.json({ matches });
  } catch (error) {
    logger.error("Error in esport live API", { error });
    return NextResponse.json({ error: "Failed to fetch live matches" }, { status: 500 });
  }
}
