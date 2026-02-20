import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  parsePaginationParams,
  parseArrayParam,
  calculateOffset,
  handleApiError,
} from "@/lib/api-utils";
import type { GameRowWithRelations, GenreTranslationRow } from "@/lib/types/supabase-queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const genres = parseArrayParam(searchParams.get("genres"));
    const { page, limit } = parsePaginationParams(searchParams);
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
    const offset = calculateOffset(page, limit);

    // When searching, first find matching game IDs via game_translations,
    // then fetch those games with ALL translations intact.
    // This avoids the PostgREST issue where ilike on a joined table filters
    // the joined rows themselves, causing non-matching translations to be dropped
    // (which results in "Untitled" when the locale-specific translation doesn't match).
    let matchingGameIds: string[] | null = null;

    if (search.trim()) {
      const searchWords = search.trim().split(/\s+/).filter(Boolean);

      // Find game IDs where any translation title matches all search words
      let searchQuery = supabase.from("game_translations").select("game_id");

      for (const word of searchWords) {
        searchQuery = searchQuery.ilike("title", `%${word}%`);
      }

      const { data: matchingTranslations, error: searchError } = await searchQuery;

      if (searchError) {
        console.error("Error searching game translations:", searchError);
        return NextResponse.json({ error: "Failed to search games" }, { status: 500 });
      }

      // Deduplicate game IDs
      matchingGameIds = [
        ...new Set(
          matchingTranslations?.map((t) => t.game_id).filter((id): id is string => id !== null) ??
            []
        ),
      ];

      // No matches found — return empty results early
      if (matchingGameIds.length === 0) {
        return NextResponse.json({
          games: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit,
            hasNextPage: false,
            hasPreviousPage: false,
            offset,
          },
          filters: { search, genres, locale, inLibrary },
        });
      }
    }

    // Build the base query with joins for translations and genres
    let query = supabase.from("games").select(
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
        game_translations(
          title,
          description,
          language_code
        ),
        game_genres(
          genres(
            genre_translations(
              name,
              language_code
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
    );

    // Filter by user's library if requested
    if (inLibrary && userId) {
      query = query.eq("user_library.user_id", userId);
    }

    // Filter by matching game IDs from the search step
    if (matchingGameIds) {
      query = query.in("id", matchingGameIds);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("games")
      .select(`id${inLibrary ? ", user_library!inner(user_id)" : ""}`, {
        count: "exact",
        head: true,
      });

    if (matchingGameIds) {
      countQuery = countQuery.in("id", matchingGameIds);
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
    let filteredGames = (games || []) as unknown as GameRowWithRelations[];
    if (genres.length > 0) {
      filteredGames =
        (games as unknown as GameRowWithRelations[])?.filter((game) => {
          const gameGenres =
            game.game_genres
              ?.map((gg) => {
                const genreTranslations = gg.genres?.genre_translations ?? [];
                const gt =
                  genreTranslations.find((t: GenreTranslationRow) => t.language_code === locale) ||
                  genreTranslations[0] ||
                  null;
                return gt?.name?.toLowerCase();
              })
              .filter(Boolean) || [];

          return genres.some((genre) => gameGenres.includes(genre.toLowerCase()));
        }) || [];
    }

    // Transform the data to match the expected format
    const transformedGames = filteredGames.map((game) => {
      // Prefer translation matching the requested locale, fallback to first available
      const translations = game.game_translations ?? [];
      const translation =
        translations.find((t) => t.language_code === locale) || translations[0] || null;

      const gameGenres =
        game.game_genres?.map((gg) => {
          const genreTranslations = gg.genres?.genre_translations ?? [];
          const gt =
            genreTranslations.find((t) => t.language_code === locale) ||
            genreTranslations[0] ||
            null;
          return { name: gt?.name || "Unknown" };
        }) || [];

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
    const errorResponse = handleApiError(error, "Failed to fetch games");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
