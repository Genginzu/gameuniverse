import { NextRequest, NextResponse } from "next/server";
import { getLiveStreams } from "@/lib/services/esportLiveService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || undefined;

    const streams = await getLiveStreams({ game });
    return NextResponse.json({ streams });
  } catch (error) {
    logger.error("Error in esport live API", { error });
    return NextResponse.json({ error: "Failed to fetch live streams" }, { status: 500 });
  }
}
