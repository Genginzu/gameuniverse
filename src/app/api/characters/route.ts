import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  parsePaginationParams,
  parseArrayParam,
  calculateOffset,
  handleApiError,
} from "@/lib/api-utils";
import type { CharacterRowWithRelations } from "@/types/supabase-queries";
import { pickTranslationWithName } from "@/lib/utils/pickTranslation";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roles = parseArrayParam(searchParams.get("roles"));
    const platforms = parseArrayParam(searchParams.get("platforms"));
    const { page, limit } = parsePaginationParams(searchParams);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types (database.types.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Calculate offset for pagination
    const offset = calculateOffset(page, limit);

    // Left join on character_translations — fallback to "en" or first available
    // when the requested locale is missing for a character.
    let query = db
      .from("characters")
      .select(
        `
        id,
        slug,
        main_image,
        background_color,
        created_at,
        character_translations(
          language_code,
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
      .eq("character_games.games.game_translations.language_code", locale);

    // Add search filter if provided
    if (search.trim()) {
      query = query.ilike("character_translations.name", `%${search.trim()}%`);
    }

    // Add role filter — filter via character_character_roles join table
    // We collect matching character IDs first, then filter the main query
    let roleCharacterIds: string[] | null = null;
    if (roles.length > 0) {
      // Resolve role slugs to role IDs
      const { data: roleRows } = await db.from("character_roles").select("id").in("slug", roles);

      if (roleRows && roleRows.length > 0) {
        const roleIds = roleRows.map((r: { id: string }) => r.id);
        const { data: ccrRows } = await db
          .from("character_character_roles")
          .select("character_id")
          .in("role_id", roleIds);

        roleCharacterIds = [
          ...new Set<string>((ccrRows || []).map((r: { character_id: string }) => r.character_id)),
        ];
      } else {
        // No matching roles found — return empty results
        roleCharacterIds = [];
      }
    }

    // Pre-resolve platform filter — collect character IDs whose games match
    // the selected platforms, before pagination (same pattern as role filter)
    let platformCharacterIds: string[] | null = null;
    if (platforms.length > 0) {
      const { data: platformRows } = await db.from("platforms").select("id").in("slug", platforms);

      if (platformRows && platformRows.length > 0) {
        const platformIds = platformRows.map((p: { id: string }) => p.id);
        const { data: gpRows } = await db
          .from("game_platforms")
          .select("game_id")
          .in("platform_id", platformIds);

        const platformGameIds = [
          ...new Set<string>(gpRows?.map((r: { game_id: string }) => r.game_id) ?? []),
        ];

        if (platformGameIds.length > 0) {
          const { data: cgRows } = await db
            .from("character_games")
            .select("character_id")
            .in("game_id", platformGameIds);

          platformCharacterIds = [
            ...new Set<string>((cgRows || []).map((r: { character_id: string }) => r.character_id)),
          ];
        } else {
          platformCharacterIds = [];
        }
      } else {
        platformCharacterIds = [];
      }
    }

    // Combine role and platform character ID filters
    let filteredCharacterIds: string[] | null = null;
    if (roleCharacterIds !== null && platformCharacterIds !== null) {
      // Intersection — character must match both filters
      const platformSet = new Set(platformCharacterIds);
      filteredCharacterIds = roleCharacterIds.filter((id) => platformSet.has(id));
    } else if (roleCharacterIds !== null) {
      filteredCharacterIds = roleCharacterIds;
    } else if (platformCharacterIds !== null) {
      filteredCharacterIds = platformCharacterIds;
    }

    if (filteredCharacterIds !== null) {
      if (filteredCharacterIds.length === 0) {
        return NextResponse.json({
          characters: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }
      query = query.in("id", filteredCharacterIds);
    }

    // Count all characters (no locale filter — characters without the requested
    // locale translation are still shown via fallback).
    // When searching by name we must join character_translations so the ilike
    // filter can resolve; otherwise a simple "id" select is enough.
    let countQuery = search.trim()
      ? db
          .from("characters")
          .select("id, character_translations!inner(name)", { count: "exact", head: true })
          .ilike("character_translations.name", `%${search.trim()}%`)
      : db.from("characters").select("id", { count: "exact", head: true });

    if (filteredCharacterIds !== null && filteredCharacterIds.length > 0) {
      countQuery = countQuery.in("id", filteredCharacterIds);
    }

    // Execute count query
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting characters", { error: countError });
      return NextResponse.json({ error: "Failed to count characters" }, { status: 500 });
    }

    // Apply pagination and execute main query
    // Tri : personnages avec image d'abord (par view_count desc), puis sans image
    const { data: characters, error } = await query
      .order("main_image", { ascending: false, nullsFirst: false })
      .order("view_count", { ascending: false })
      .order("name", { referencedTable: "character_translations", ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching characters", { error });
      return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 });
    }

    const typedCharacters = (characters || []) as CharacterRowWithRelations[];

    // Transform the data to match the expected format
    const transformedCharacters = typedCharacters.map((character) => {
      const translation = pickTranslationWithName(character.character_translations, locale);

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
    logger.error("Error in characters API", { error });
    const errorResponse = handleApiError(error, "Failed to fetch characters");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
