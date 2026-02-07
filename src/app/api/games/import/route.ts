import { NextRequest, NextResponse } from "next/server";
import { GameImportService } from "@/lib/services/gameImportService";

/**
 * POST /api/games/import
 *
 * Imports a game from IGDB into the local Supabase database.
 * Creates the game with all available data including translations and related entities.
 *
 * Request Body:
 * - igdbId (required): The IGDB game ID to import
 *
 * Returns:
 * - 201: Game created successfully with game details
 * - 400: Invalid request (missing or invalid igdbId)
 * - 409: Game already exists
 * - 500: Internal server error
 *
 * Requirements: 5.1, 5.2, 5.5, 5.6
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: { igdbId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Validate igdbId
    const { igdbId } = body;

    if (igdbId === undefined || igdbId === null) {
      return NextResponse.json({ error: "igdbId is required" }, { status: 400 });
    }

    // Ensure igdbId is a valid number
    const parsedIgdbId = typeof igdbId === "number" ? igdbId : parseInt(String(igdbId), 10);

    if (isNaN(parsedIgdbId) || parsedIgdbId <= 0) {
      return NextResponse.json({ error: "igdbId must be a positive integer" }, { status: 400 });
    }

    // Import the game from IGDB
    const result = await GameImportService.importFromIGDB(parsedIgdbId);

    if (!result.success) {
      // Check if it's a "not found" error
      if (result.error?.includes("not found")) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      // Generic error (Requirement 5.6)
      return NextResponse.json({ error: result.error || "Failed to import game" }, { status: 500 });
    }

    // Success - return created game (Requirement 5.5)
    return NextResponse.json(
      {
        success: true,
        game: result.game,
        message: "Game imported successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in game import API:", error);
    return NextResponse.json({ error: "Internal server error during import" }, { status: 500 });
  }
}
