import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

// GET /api/library - Get user's library
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's library with game details
    const { data: libraryGames, error } = await supabase
      .from("user_library")
      .select(
        `
        id,
        game_id,
        status,
        added_at,
        play_time_hours,
        rating,
        notes,
        games (
          id,
          slug,
          developer,
          publisher,
          release_date,
          current_price,
          currency,
          metascore,
          pegi_rating,
          media,
          game_translations (
            title,
            description,
            language_code
          ),
          game_genres (
            genres (
              id,
              slug,
              genre_translations (
                name,
                language_code
              )
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) {
      // PGRST205 = table not found (migration not applied yet)
      if (error.code === "PGRST205") {
        console.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({ games: [] });
      }
      console.error("Error fetching user library:", error);
      return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
    }

    // Transform the data to match our frontend expectations
    const transformedGames = libraryGames
      ?.map((item) => {
        const game = item.games;
        if (!game) return null;

        // Get French translation first, fallback to English
        const translation =
          game.game_translations?.find((t) => t.language_code === "fr") ||
          game.game_translations?.[0];

        // Transform genres
        const genres =
          game.game_genres?.map((gg) => {
            const genre = gg.genres;
            const genreTranslation =
              genre?.genre_translations?.find((gt) => gt.language_code === "fr") ||
              genre?.genre_translations?.[0];

            return {
              id: genre?.id,
              name: genreTranslation?.name || "Unknown Genre",
            };
          }) || [];

        // Parse media
        const media = typeof game.media === "string" ? JSON.parse(game.media) : game.media || {};

        return {
          id: game.id,
          slug: game.slug,
          title: translation?.title || "Untitled Game",
          description: translation?.description,
          coverImage: media.coverImage,
          backgroundImage: media.backgroundImage,
          backgroundColor: media.backgroundColor,
          releaseDate: game.release_date,
          releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : undefined,
          genres,
          developer: game.developer || "Unknown Developer",
          publisher: game.publisher || "Unknown Publisher",
          metascore: game.metascore,
          // Library-specific data
          libraryStatus: item.status,
          addedAt: item.added_at,
          playTimeHours: item.play_time_hours,
          userRating: item.rating,
          notes: item.notes,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ games: transformedGames });
  } catch (error) {
    console.error("Error in library API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/library - Add game to user's library
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, status = "owned" } = body;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Add game to user's library
    const { data, error } = await supabase
      .from("user_library")
      .insert({
        user_id: user.id,
        game_id: gameId,
        status,
      })
      .select()
      .single();

    if (error) {
      // PGRST205 = table not found (migration not applied yet)
      if (error.code === "PGRST205") {
        console.warn("user_library table not found - migration not applied yet");
        return NextResponse.json(
          { error: "Library feature not available yet. Please contact administrator." },
          { status: 503 }
        );
      }
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "Game already in library" }, { status: 409 });
      }
      console.error("Error adding game to library:", error);
      return NextResponse.json({ error: "Failed to add game to library" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in library POST API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
