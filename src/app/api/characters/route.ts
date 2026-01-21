import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const games = searchParams.get("games")?.split(",").filter(Boolean) || [];
    const roles = searchParams.get("roles")?.split(",").filter(Boolean) || [];
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const locale = searchParams.get("locale") || "fr";

    // Validate parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

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
      console.error("Error counting characters:", countError);
      return NextResponse.json({ error: "Failed to count characters" }, { status: 500 });
    }

    // Apply pagination and execute main query
    const { data: characters, error } = await query
      .range(offset, offset + limit - 1)
      .order("character_translations.name", { ascending: true });

    if (error) {
      console.error("Error fetching characters:", error);
      return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 });
    }

    // Filter by games if specified (post-processing)
    let filteredCharacters = characters || [];
    if (games.length > 0) {
      filteredCharacters =
        characters?.filter((character: any) => {
          const characterGameIds =
            character.character_games?.map((cg: any) => cg.games?.id).filter(Boolean) || [];
          return games.some((gameId) => characterGameIds.includes(gameId));
        }) || [];
    }

    // Transform the data to match the expected format
    const transformedCharacters = filteredCharacters.map((character: any) => {
      const translation = character.character_translations?.[0];

      // Get primary game
      const primaryGameRelation = character.character_games?.find(
        (cg: any) => cg.is_primary === true
      );
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
    });

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
    console.error("Unexpected error in characters API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
