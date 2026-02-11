import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminCharacterFormSchema } from "@/lib/validations/admin-character-form";
import { characterFormToPayload } from "@/lib/utils/character-form-utils";

// Explicit type for the Supabase nested select result
// (Supabase infers `never` for deeply nested joins)
interface CharacterDetailRow {
  id: string;
  slug: string;
  main_image: string | null;
  background_image: string | null;
  background_color: string | null;
  created_at: string;
  updated_at: string;
  character_translations: Array<{
    id: string;
    language_code: string;
    name: string;
    role: string | null;
    description: string | null;
    biography: string | null;
  }>;
  character_games: Array<{
    id: string;
    game_id: string;
    is_primary: boolean;
    games: {
      id: string;
      slug: string;
      game_translations: Array<{ title: string; language_code: string }>;
    };
  }>;
  character_media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail_url: string | null;
    title: string | null;
    description: string | null;
    alt_text: string | null;
    is_featured: boolean;
    display_order: number;
  }>;
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/characters/[id] - Full character details for editing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: characterId } = await params;

    if (!characterId) {
      return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types (database.types.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("characters")
      .select(
        `
        id,
        slug,
        main_image,
        background_image,
        background_color,
        created_at,
        updated_at,
        character_translations(
          id,
          language_code,
          name,
          role,
          description,
          biography
        ),
        character_games(
          id,
          game_id,
          is_primary,
          games(
            id,
            slug,
            game_translations(title, language_code)
          )
        ),
        character_media(
          id,
          type,
          url,
          thumbnail_url,
          title,
          description,
          alt_text,
          is_featured,
          display_order
        )
      `
      )
      .eq("id", characterId)
      .single();

    const character = data as CharacterDetailRow | null;

    if (error) {
      console.error("Error fetching character details:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Character not found" }, { status: 404 });
      }

      return NextResponse.json({ error: "Failed to fetch character details" }, { status: 500 });
    }

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: character.id,
      slug: character.slug,
      main_image: character.main_image,
      background_image: character.background_image,
      background_color: character.background_color,
      created_at: character.created_at,
      updated_at: character.updated_at,
      translations: character.character_translations || [],
      games: character.character_games || [],
      media: character.character_media || [],
    });
  } catch (error) {
    console.error("Error in admin character GET:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/characters/[id] - Full update with relation replacement
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: characterId } = await params;

    if (!characterId) {
      return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
    }

    const body = await request.json();

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

    // Check if character exists
    const { data: existing, error: checkError } = await db
      .from("characters")
      .select("id")
      .eq("id", characterId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Update main character data
    const { error: updateError } = await db
      .from("characters")
      .update({
        slug: payload.character.slug,
        main_image: payload.character.main_image,
        background_image: payload.character.background_image,
        background_color: payload.character.background_color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    if (updateError) {
      console.error("Error updating character:", updateError);

      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "Character with this slug already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
    }

    // Replace translations
    await db.from("character_translations").delete().eq("character_id", characterId);

    if (payload.translations.length > 0) {
      const translationsWithId = payload.translations.map((t) => ({
        ...t,
        character_id: characterId,
      }));
      const { error: translationsError } = await db
        .from("character_translations")
        .insert(translationsWithId);

      if (translationsError) {
        console.error("Error updating translations:", translationsError);
        return NextResponse.json({ error: "Failed to update translations" }, { status: 500 });
      }
    }

    // Replace game relations
    await db.from("character_games").delete().eq("character_id", characterId);

    if (payload.games.length > 0) {
      const gamesWithId = payload.games.map((g) => ({
        ...g,
        character_id: characterId,
      }));
      const { error: gamesError } = await db.from("character_games").insert(gamesWithId);

      if (gamesError) {
        console.error("Error updating game relations:", gamesError);
        return NextResponse.json({ error: "Failed to update game relations" }, { status: 500 });
      }
    }

    // Replace media
    await db.from("character_media").delete().eq("character_id", characterId);

    if (payload.media.length > 0) {
      const mediaWithId = payload.media.map((m) => ({
        ...m,
        character_id: characterId,
      }));
      const { error: mediaError } = await db.from("character_media").insert(mediaWithId);

      if (mediaError) {
        console.error("Error updating media:", mediaError);
        return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Character updated successfully",
      characterId,
    });
  } catch (error) {
    console.error("Error in admin character PUT:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/characters/[id] - Delete with cascade
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id: characterId } = await params;

    if (!characterId) {
      return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types (database.types.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Check if character exists
    const { data: existing, error: checkError } = await db
      .from("characters")
      .select("id, slug")
      .eq("id", characterId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // CASCADE will handle all related data
    const { error: deleteError } = await db.from("characters").delete().eq("id", characterId);

    if (deleteError) {
      console.error("Error deleting character:", deleteError);
      return NextResponse.json({ error: "Failed to delete character" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Character deleted successfully",
      characterId,
      slug: existing.slug,
    });
  } catch (error) {
    console.error("Error in admin character DELETE:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
