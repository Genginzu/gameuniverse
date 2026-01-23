import { NextRequest, NextResponse } from "next/server";
import { PlayerService } from "@/lib/services/playerService";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { id: playerId } = await params;

    // Validate player ID is provided
    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    // Validate player ID format (UUID)
    if (!PlayerService.validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Invalid player ID format" }, { status: 400 });
    }

    // Fetch player details using the service
    const player = await PlayerService.fetchPlayerDetailsFromDB(playerId, locale);

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error("Unexpected error in player details API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
