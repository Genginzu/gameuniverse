import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";
import { GAME_COUNT_RANGES } from "@/types/player";
import { parsePaginationParams, handleApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const gameCountRange = searchParams.get("gameCountRange") || undefined;
    const { page, limit } = parsePaginationParams(searchParams);

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
    logger.error("Error in players API", { error });
    const errorResponse = handleApiError(error, "Failed to fetch players");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
