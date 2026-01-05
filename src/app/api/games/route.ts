import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the base query with joins for translations and genres
    let query = supabase
      .from("games")
      .select(
        `
        id,
        slug,
        cover_image_url,
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
        )
      `
      )
      .eq("game_translations.language_code", locale);

    // Add search filter if provided
    if (search.trim()) {
      query = query.ilike("game_translations.title", `%${search.trim()}%`);
    }

    // Get total count for pagination (separate query for performance)
    let countQuery = supabase
      .from("games")
      .select("id, game_translations!inner(language_code)", { count: "exact", head: true })
      .eq("game_translations.language_code", locale);

    if (search.trim()) {
      countQuery = countQuery.ilike("game_translations.title", `%${search.trim()}%`);
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
    let filteredGames = games || [];
    if (genres.length > 0) {
      filteredGames =
        games?.filter((game: any) => {
          const gameGenres =
            game.game_genres
              ?.map((gg: any) => gg.genres?.genre_translations?.[0]?.name?.toLowerCase())
              .filter(Boolean) || [];

          return genres.some((genre) => gameGenres.includes(genre.toLowerCase()));
        }) || [];
    }

    // Transform the data to match the expected format
    const transformedGames = filteredGames.map((game: any) => {
      const translation = game.game_translations?.[0];
      const gameGenres =
        game.game_genres?.map((gg: any) => ({
          name: gg.genres?.genre_translations?.[0]?.name || "Unknown",
        })) || [];

      // Get primary developer/publisher
      const developer =
        game.game_companies?.find((gc: any) => gc.role === "developer" && gc.is_primary)?.companies
          ?.name ||
        game.game_companies?.find((gc: any) => gc.role === "developer")?.companies?.name ||
        "Unknown";

      const publisher =
        game.game_companies?.find((gc: any) => gc.role === "publisher" && gc.is_primary)?.companies
          ?.name ||
        game.game_companies?.find((gc: any) => gc.role === "publisher")?.companies?.name ||
        "Unknown";

      return {
        id: game.id,
        slug: game.slug,
        title: translation?.title || "Untitled",
        description: translation?.description,
        coverImage: game.cover_image_url,
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
      },
    });
  } catch (error) {
    console.error("Unexpected error in games API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
