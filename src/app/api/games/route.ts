import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  parsePaginationParams,
  parseArrayParam,
  calculateOffset,
  handleApiError,
} from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { buildEmptyGamesResponse, buildPaginationMeta } from "@/lib/services/gameListingHelpers";
import { resolveGameIdFilters } from "@/lib/services/gameFilterResolvers";
import { parseGameListingSort } from "@/types/game";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const genres = parseArrayParam(searchParams.get("genres"));
    const platforms = parseArrayParam(searchParams.get("platforms"));
    const { page, limit } = parsePaginationParams(searchParams, {
      maxLimit: search.trim() ? 10000 : undefined,
    });
    const locale = searchParams.get("locale") || "fr";
    const inLibrary = searchParams.get("inLibrary") === "true";
    const fields = parseArrayParam(searchParams.get("fields"));
    const sort = parseGameListingSort(searchParams.get("sort"));
    const esportParam = searchParams.get("esport");
    const esport = esportParam === "true" ? true : esportParam === "false" ? false : null;

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

    const offset = calculateOffset(page, limit);
    const filters = { search, genres, platforms, locale, inLibrary, sort };

    // Resolve search/platform/genre filters into game IDs
    const { gameIds: matchingGameIds, error: filterError } = await resolveGameIdFilters(supabase, {
      search,
      genres,
      platforms,
    });

    if (filterError) {
      return NextResponse.json({ error: filterError }, { status: 500 });
    }

    // Filters matched nothing — return empty early
    if (matchingGameIds !== null && matchingGameIds.length === 0) {
      return NextResponse.json(buildEmptyGamesResponse(page, limit, offset, filters));
    }

    // Call the optimized database function instead of nested PostgREST joins
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcResult, error } = await (supabase as any).rpc("get_games_listing", {
      p_locale: locale,
      p_limit: limit,
      p_offset: offset,
      p_game_ids: matchingGameIds,
      p_in_library: inLibrary,
      p_user_id: userId,
      p_include_description: fields.includes("description"),
      p_sort_by: sort,
      p_esport: esport,
    });

    if (error) {
      logger.error("Error fetching games", { error });
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }

    const { games: rawGames, totalCount } = rpcResult as {
      games: Array<{
        id: string;
        slug: string;
        igdb_id: number | null;
        cover_image_url: string | null;
        background_image_url: string | null;
        background_color: string | null;
        release_date: string | null;
        metascore: number | null;
        created_at: string;
        title: string;
        description: string | null;
        genres: Array<{ name: string }>;
        developer: string;
        is_esport: boolean;
        publisher: string;
      }>;
      totalCount: number;
    };

    // Map to the public API shape (add computed fields)
    const transformedGames = (rawGames || []).map((game) => ({
      id: game.id,
      slug: game.slug,
      igdbId: game.igdb_id,
      title: game.title,
      description: fields.includes("description") ? game.description : undefined,
      coverImage: game.cover_image_url,
      backgroundImage: game.background_image_url,
      backgroundColor: game.background_color,
      releaseDate: game.release_date,
      releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : null,
      genres: game.genres || [],
      developer: game.developer,
      publisher: game.publisher,
      metascore: game.metascore,
      createdAt: game.created_at,
      isEsport: game.is_esport,
    }));

    const pagination = buildPaginationMeta(totalCount || 0, page, limit, offset);

    return NextResponse.json({
      games: transformedGames,
      pagination,
      filters,
    });
  } catch (error) {
    logger.error("Error in games API", { error });
    const errorResponse = handleApiError(error, "Failed to fetch games");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
