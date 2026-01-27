import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

// Type definitions for Supabase query results
interface GameTranslation {
  title: string;
  description: string | null;
}

interface GenreTranslation {
  name: string;
}

interface Genre {
  genre_translations: GenreTranslation[] | null;
}

interface GameGenre {
  genres: Genre | null;
}

interface Company {
  name: string;
  slug: string;
}

interface GameCompany {
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: Company | null;
}

interface GameRow {
  id: string;
  slug: string;
  igdb_id: number | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  release_date: string | null;
  metascore: number | null;
  created_at: string;
  game_translations: GameTranslation[] | null;
  game_genres: GameGenre[] | null;
  game_companies: GameCompany[] | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const locale = searchParams.get("locale") || "fr";
    const inLibrary = searchParams.get("inLibrary") === "true";

    const supabase = await createRouteHandlerClient();

    // If library filtering is requested, check authentication
    let userId: string | null = null;
    if (inLibrary) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      userId = user.id;
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the base query with joins for translations and genres
    // Add user_library join if filtering by library
    let query = supabase
      .from("games")
      .select(
        `
        id,
        slug,
        igdb_id,
        cover_image_url,
        background_image_url,
        background_color,
        release_date,
        metascore,
        created_at,
        game_translations!inner(
          title,
          description
        ),
        game_genres(
          genres(
            genre_translations(
              name
            )
          )
        ),
        game_companies(
          company_id,
          role,
          is_primary,
          companies(
            name,
            slug
          )
        )${
          inLibrary
            ? `,
        user_library!inner(
          user_id,
          status,
          added_at,
          play_time_hours,
          rating
        )`
            : ""
        }
      `
      )
      .eq("game_translations.language_code", locale);

    // Filter by user's library if requested
    if (inLibrary && userId) {
      query = query.eq("user_library.user_id", userId);
    }

    // Add search filter if provided
    if (search.trim()) {
      query = query.ilike("game_translations.title", `%${search.trim()}%`);
    }

    // Get total count for pagination (separate query for performance)
    let countQuery = supabase
      .from("games")
      .select(
        `id, game_translations!inner(language_code)${inLibrary ? ", user_library!inner(user_id)" : ""}`,
        { count: "exact", head: true }
      )
      .eq("game_translations.language_code", locale);

    if (search.trim()) {
      countQuery = countQuery.ilike("game_translations.title", `%${search.trim()}%`);
    }

    // Filter count by user's library if requested
    if (inLibrary && userId) {
      countQuery = countQuery.eq("user_library.user_id", userId);
    }

    // Execute count query
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting games:", countError);
      return NextResponse.json({ error: "Failed to count games" }, { status: 500 });
    }

    // Apply pagination and execute main query
    const { data: games, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching games:", error);
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }

    // Filter by genres if specified (post-processing for now, could be optimized with SQL)
    let filteredGames = (games || []) as GameRow[];
    if (genres.length > 0) {
      filteredGames =
        (games as GameRow[])?.filter((game) => {
          const gameGenres =
            game.game_genres
              ?.map((gg) => gg.genres?.genre_translations?.[0]?.name?.toLowerCase())
              .filter(Boolean) || [];

          return genres.some((genre) => gameGenres.includes(genre.toLowerCase()));
        }) || [];
    }

    // Transform the data to match the expected format
    const transformedGames = filteredGames.map((game) => {
      const translation = game.game_translations?.[0];
      const gameGenres =
        game.game_genres?.map((gg) => ({
          name: gg.genres?.genre_translations?.[0]?.name || "Unknown",
        })) || [];

      // Get primary developer/publisher
      const developer =
        game.game_companies?.find((gc) => gc.role === "developer" && gc.is_primary)?.companies
          ?.name ||
        game.game_companies?.find((gc) => gc.role === "developer")?.companies?.name ||
        "Unknown";

      const publisher =
        game.game_companies?.find((gc) => gc.role === "publisher" && gc.is_primary)?.companies
          ?.name ||
        game.game_companies?.find((gc) => gc.role === "publisher")?.companies?.name ||
        "Unknown";

      return {
        id: game.id,
        slug: game.slug,
        igdbId: game.igdb_id,
        title: translation?.title || "Untitled",
        description: translation?.description,
        coverImage: game.cover_image_url,
        backgroundImage: game.background_image_url,
        backgroundColor: game.background_color,
        releaseDate: game.release_date,
        releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : null,
        genres: gameGenres,
        developer,
        publisher,
        metascore: game.metascore,
        createdAt: game.created_at,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      games: transformedGames,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        limit,
        hasNextPage,
        hasPreviousPage,
        offset,
      },
      filters: {
        search,
        genres,
        locale,
        inLibrary,
      },
    });
  } catch (error) {
    console.error("Unexpected error in games API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
