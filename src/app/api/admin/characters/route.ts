import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  adminCharacterFormSchema,
  adminCharacterQuerySchema,
} from "@/lib/validations/admin-character-form";
import { characterFormToPayload } from "@/lib/utils/character-form-utils";

// Types for Supabase query results
interface CharacterRow {
  id: string;
  slug: string;
  main_image: string | null;
  created_at: string;
  updated_at: string;
  character_translations?: Array<{
    name: string;
    role: string | null;
    language_code: string;
  }>;
  character_games?: Array<{
    is_primary: boolean;
    games?: { id: string; game_translations?: Array<{ title: string }> };
  }>;
}

/**
 * GET /api/admin/characters - List characters with pagination, search, sort
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const rawParams: Record<string, string | undefined> = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort_by: searchParams.get("sort_by") ?? undefined,
      sort_order: searchParams.get("sort_order") ?? undefined,
      locale: searchParams.get("locale") ?? undefined,
    };

    const queryResult = adminCharacterQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order, locale } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Character tables are not yet in generated Supabase types (database.types.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Use !inner join on translations when searching, otherwise left join
    const translationJoin = search?.trim()
      ? "character_translations!inner"
      : "character_translations";

    let query = db.from("characters").select(
      `
        id,
        slug,
        main_image,
        created_at,
        updated_at,
        ${translationJoin}(
          name,
          role,
          language_code
        ),
        character_games(
          is_primary,
          games(
            id,
            game_translations(title)
          )
        )
      `
    );

    if (search?.trim()) {
      query = query.ilike("character_translations.name", `%${search.trim()}%`);
    }

    // Count query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery: any = db.from("characters").select("id", { count: "exact", head: true });

    if (search?.trim()) {
      countQuery = db
        .from("characters")
        .select("id, character_translations!inner(name)", {
          count: "exact",
          head: true,
        })
        .ilike("character_translations.name", `%${search.trim()}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting characters:", countError);
      return NextResponse.json({ error: "Failed to count characters" }, { status: 500 });
    }

    const sortColumn = sort_by === "name" ? "character_translations.name" : sort_by;

    const { data: characters, error } = await query
      .order(sortColumn, { ascending: sort_order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching admin characters:", error);
      return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 });
    }

    const transformedCharacters =
      (characters as CharacterRow[] | null)?.map((char) => {
        const translations = char.character_translations ?? [];
        const translation =
          translations.find((t) => t.language_code === locale) || translations[0] || null;

        const primaryGameEntry = char.character_games?.find((cg) => cg.is_primary);
        const primaryGameTitle = primaryGameEntry?.games?.game_translations?.[0]?.title ?? "";

        return {
          id: char.id,
          slug: char.slug,
          name: translation?.name || "Unnamed",
          role: translation?.role || null,
          mainImage: char.main_image,
          primaryGame: primaryGameTitle,
          updatedAt: char.updated_at,
        };
      }) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      characters: transformedCharacters,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in admin characters GET:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/characters - Create a new character with relations
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    // Validate form data then convert to payload
    const validationResult = adminCharacterFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const payload = characterFormToPayload(validationResult.data);
    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types (database.types.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Create the character
    const { data: createdCharacter, error: charError } = await db
      .from("characters")
      .insert([
        {
          slug: payload.character.slug,
          main_image: payload.character.main_image,
          background_image: payload.character.background_image,
          background_color: payload.character.background_color,
        },
      ])
      .select("id, slug")
      .single();

    if (charError) {
      console.error("Error creating character:", charError);

      if (charError.code === "23505") {
        return NextResponse.json(
          { error: "Character with this slug already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
    }

    const characterId = createdCharacter.id;

    try {
      // Insert translations
      if (payload.translations.length > 0) {
        const translationsWithId = payload.translations.map((t) => ({
          ...t,
          character_id: characterId,
        }));
        const { error: translationsError } = await db
          .from("character_translations")
          .insert(translationsWithId);

        if (translationsError) {
          throw new Error(`Failed to create translations: ${translationsError.message}`);
        }
      }

      // Insert game relations
      if (payload.games.length > 0) {
        const gamesWithId = payload.games.map((g) => ({
          ...g,
          character_id: characterId,
        }));
        const { error: gamesError } = await db.from("character_games").insert(gamesWithId);

        if (gamesError) {
          throw new Error(`Failed to create game relations: ${gamesError.message}`);
        }
      }

      // Insert media
      if (payload.media.length > 0) {
        const mediaWithId = payload.media.map((m) => ({
          ...m,
          character_id: characterId,
        }));
        const { error: mediaError } = await db.from("character_media").insert(mediaWithId);

        if (mediaError) {
          throw new Error(`Failed to create media: ${mediaError.message}`);
        }
      }

      return NextResponse.json(
        {
          message: "Character created successfully",
          character: { id: characterId, slug: createdCharacter.slug },
        },
        { status: 201 }
      );
    } catch (relatedDataError) {
      console.error("Error creating related data:", relatedDataError);

      // Clean up the character if related data insertion fails
      await db.from("characters").delete().eq("id", characterId);

      return NextResponse.json(
        {
          error: "Failed to create character with related data",
          details: String(relatedDataError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in admin characters POST:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
