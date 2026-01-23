import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { GAME_COUNT_RANGES, GameCountRangeKey } from "@/types/player";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const gameCountRange = searchParams.get("gameCountRange") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // Validate page parameter
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    // Validate gameCountRange if provided
    if (gameCountRange && !(gameCountRange in GAME_COUNT_RANGES)) {
      return NextResponse.json(
        {
          error: "Invalid gameCountRange parameter",
          validValues: Object.keys(GAME_COUNT_RANGES),
        },
        { status: 400 }
      );
    }

    // Fetch players using the service
    const result = await PlayerService.fetchPlayersFromDB({
      search,
      gameCountRange,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error in players API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
