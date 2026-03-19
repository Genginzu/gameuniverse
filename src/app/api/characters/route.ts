import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  parsePaginationParams,
  parseArrayParam,
  calculateOffset,
  handleApiError,
} from "@/lib/api-utils";
import type { CharacterRowWithRelations } from "@/lib/types/supabase-queries";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const games = parseArrayParam(searchParams.get("games"));
    const roles = parseArrayParam(searchParams.get("roles"));
    const platforms = parseArrayParam(searchParams.get("platforms"));
    const { page, limit } = parsePaginationParams(searchParams);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    // Calculate offset for pagination
    const offset = calculateOffset(page, limit);

    // Build the base query with joins for translations and games
    let query = supabase
      .from("characters")
      .select(
        `
        id,
        slug,
        main_image,
        background_color,
        created_at,
        character_translations!inner(
          name,
          role,
          description
        ),
        character_games(
          is_primary,
          games(
            id,
            slug,
            game_translations(
              title
            )
          )
        )
      `
      )
      .eq("character_translations.language_code", locale)
      .eq("character_games.games.game_translations.language_code", locale);

    // Add search filter if provided
    if (search.trim()) {
      query = query.ilike("character_translations.name", `%${search.trim()}%`);
    }

    // Add role filter if provided
    if (roles.length > 0) {
      query = query.in("character_translations.role", roles);
    }

    // Get total count for pagination (separate query for performance)
    let countQuery = supabase
      .from("characters")
      .select("id, character_translations!inner(language_code, name, role)", {
        count: "exact",
        head: true,
      })
      .eq("character_translations.language_code", locale);

    if (search.trim()) {
      countQuery = countQuery.ilike("character_translations.name", `%${search.trim()}%`);
    }

    if (roles.length > 0) {
      countQuery = countQuery.in("character_translations.role", roles);
    }

    // Execute count query
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting characters", { error: countError });
      return NextResponse.json({ error: "Failed to count characters" }, { status: 500 });
    }

    // Apply pagination and execute main query
    // Note: Supabase doesn't support ordering by joined table columns directly
    // We'll order by created_at and sort by name in post-processing
    const { data: characters, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching characters", { error });
      return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 });
    }

    // Filter by games if specified (post-processing)
    let filteredCharacters = (characters || []) as CharacterRowWithRelations[];
    if (games.length > 0) {
      filteredCharacters =
        (characters as CharacterRowWithRelations[])?.filter((character) => {
          const characterGameIds =
            character.character_games?.map((cg) => cg.games?.id).filter(Boolean) || [];
          return games.some((gameId) => characterGameIds.includes(gameId));
        }) || [];
    }

    // Filter by platforms if specified — keep characters whose at least one game
    // is available on one of the selected platforms
    if (platforms.length > 0) {
      const { data: platformRows } = await supabase
        .from("platforms")
        .select("id")
        .in("slug", platforms);

      if (platformRows && platformRows.length > 0) {
        const platformIds = platformRows.map((p: { id: string }) => p.id);
        const { data: gpRows } = await supabase
          .from("game_platforms")
          .select("game_id")
          .in("platform_id", platformIds);

        const platformGameIds = new Set(gpRows?.map((r: { game_id: string }) => r.game_id) ?? []);

        filteredCharacters = filteredCharacters.filter((character) => {
          const characterGameIds =
            character.character_games?.map((cg) => cg.games?.id).filter(Boolean) || [];
          return characterGameIds.some((gameId) => platformGameIds.has(gameId as string));
        });
      }
    }

    // Transform the data to match the expected format
    const transformedCharacters = filteredCharacters
      .map((character) => {
        const translation = character.character_translations?.[0];

        // Get primary game
        const primaryGameRelation = character.character_games?.find((cg) => cg.is_primary === true);
        const primaryGame =
          primaryGameRelation?.games?.game_translations?.[0]?.title ||
          character.character_games?.[0]?.games?.game_translations?.[0]?.title ||
          "Unknown";

        // Count total games
        const gamesCount = character.character_games?.length || 0;

        return {
          id: character.id,
          slug: character.slug,
          name: translation?.name || "Unnamed",
          role: translation?.role,
          description: translation?.description,
          mainImage: character.main_image,
          backgroundColor: character.background_color,
          primaryGame,
          gamesCount,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, locale));

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      characters: transformedCharacters,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    logger.error("Error in characters API", { error });
    const errorResponse = handleApiError(error, "Failed to fetch characters");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
