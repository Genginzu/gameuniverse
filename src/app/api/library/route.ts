import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { AchievementEngine } from "@/lib/services/achievementEngine";
import { CoinService } from "@/lib/services/coinService";
import { logger } from "@/lib/logger";

// Type definitions for Supabase query results
interface GameTranslation {
  title: string;
  description: string | null;
  language_code: string;
}

interface GenreTranslation {
  name: string;
  language_code: string;
}

interface Genre {
  id: string;
  slug: string;
  genre_translations: GenreTranslation[] | null;
}

interface GameGenre {
  genres: Genre | null;
}

interface Company {
  name: string;
}

interface GameCompany {
  role: string;
  is_primary: boolean;
  companies: Company | null;
}

interface GamePrice {
  price: number;
  currency: string;
  is_available: boolean;
}

interface Rating {
  display_name: string;
  minimum_age: number;
}

interface GameRating {
  is_primary: boolean;
  ratings: Rating | null;
}

interface GameArtwork {
  url: string;
  artwork_type: string;
  is_featured: boolean;
}

interface LibraryGame {
  id: string;
  slug: string;
  release_date: string | null;
  metascore: number | null;
  cover_image_url: string | null;
  background_color: string | null;
  game_translations: GameTranslation[] | null;
  game_genres: GameGenre[] | null;
  game_companies: GameCompany[] | null;
  game_prices: GamePrice[] | null;
  game_ratings: GameRating[] | null;
  game_artwork: GameArtwork[] | null;
}

interface LibraryEntry {
  id: string;
  game_id: string;
  status: string;
  added_at: string;
  play_time_hours: number | null;
  rating: number | null;
  notes: string | null;
  games: LibraryGame | null;
}

// GET /api/library - Get user's library
export async function GET() {
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
          release_date,
          metascore,
          cover_image_url,
          background_color,
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
          ),
          game_companies (
            role,
            is_primary,
            companies (
              name
            )
          ),
          game_prices (
            price,
            currency,
            is_available
          ),
          game_ratings (
            is_primary,
            ratings (
              display_name,
              minimum_age
            )
          ),
          game_artwork (
            url,
            artwork_type,
            is_featured
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) {
      // PGRST205 = table not found (migration not applied yet)
      if (error.code === "PGRST205") {
        logger.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({ games: [] });
      }
      logger.error("Error fetching user library", { error });
      return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
    }

    // Transform the data to match our frontend expectations
    const transformedGames = (libraryGames as unknown as LibraryEntry[])
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

        // Get background image from artwork
        const gameArtwork = game.game_artwork || [];
        const backgroundArtwork =
          gameArtwork.find((a) => a.is_featured) ||
          gameArtwork.find((a) => a.artwork_type === "wallpaper") ||
          gameArtwork[0];

        // Extract developer and publisher from game_companies
        const gameCompanies = game.game_companies || [];
        const developerCompany =
          gameCompanies.find((gc) => gc.role === "developer" && gc.is_primary) ||
          gameCompanies.find((gc) => gc.role === "developer");
        const publisherCompany =
          gameCompanies.find((gc) => gc.role === "publisher" && gc.is_primary) ||
          gameCompanies.find((gc) => gc.role === "publisher");

        // Extract price from game_prices (get first available price)
        const gamePrices = game.game_prices || [];
        const availablePrice = gamePrices.find((gp) => gp.is_available) || gamePrices[0];

        // Extract rating from game_ratings (get primary rating)
        const gameRatings = game.game_ratings || [];
        const primaryRating = gameRatings.find((gr) => gr.is_primary) || gameRatings[0];

        return {
          id: game.id,
          slug: game.slug,
          title: translation?.title || "Untitled Game",
          description: translation?.description,
          coverImage: game.cover_image_url,
          backgroundImage: backgroundArtwork?.url,
          backgroundColor: game.background_color,
          releaseDate: game.release_date,
          releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : undefined,
          genres,
          developer: developerCompany?.companies?.name || "Unknown Developer",
          publisher: publisherCompany?.companies?.name || "Unknown Publisher",
          metascore: game.metascore,
          currentPrice: availablePrice?.price,
          currency: availablePrice?.currency,
          pegiRating: primaryRating?.ratings?.minimum_age,
          ratingDisplayName: primaryRating?.ratings?.display_name,
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
    logger.error("Error in library API", { error });
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
        logger.warn("user_library table not found - migration not applied yet");
        return NextResponse.json(
          { error: "Library feature not available yet. Please contact administrator." },
          { status: 503 }
        );
      }
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "Game already in library" }, { status: 409 });
      }
      logger.error("Error adding game to library", { error });
      return NextResponse.json({ error: "Failed to add game to library" }, { status: 500 });
    }

    // Evaluate achievements (non-blocking)
    try {
      await AchievementEngine.evaluate(user.id, "library");
    } catch (error) {
      console.error("Achievement evaluation failed:", error);
    }

    // Reward GU Coins (non-blocking)
    CoinService.rewardActivity(user.id, "library_add", gameId).catch((err) =>
      logger.error("Coin reward failed", { error: err })
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("Error in library POST API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
