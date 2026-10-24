import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { adminCharacterFormSchema } from "@/lib/validations/admin-character-form";
import { characterFormToPayload } from "@/lib/utils/character-form-utils";
import { logger } from "@/lib/logger";

// Supabase nested select result type (Supabase infers `never` for deeply nested joins)
interface CharacterDetailRow {
  id: string;
  slug: string;
  igdb_id: number | null;
  main_image: string | null;
  background_image: string | null;
  background_color: string | null;
  gender_id: string | null;
  species_id: string | null;
  created_at: string;
  updated_at: string;
  character_translations: Array<{
    language_code: string;
    name: string;
    role: string | null;
    description: string | null;
    biography: string | null;
    weapons: string | null;
  }>;
  character_games: Array<{
    game_id: string;
    is_primary: boolean;
    games: {
      id: string;
      slug: string;
      game_translations: Array<{ title: string; language_code: string }>;
    };
  }>;
  character_media: Array<{
    type: string;
    url: string;
    thumbnail_url: string | null;
    title: string | null;
    description: string | null;
    alt_text: string | null;
    is_featured: boolean;
    display_order: number;
  }>;
  character_relationships: Array<{
    related_character_id: string;
    relationship_type: string;
    description: string | null;
  }>;
  character_character_roles: Array<{
    role_id: string;
  }>;
}

/** GET /api/admin/characters/[id] - Full character details for editing */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: characterId } = params;

  if (!characterId) throw validationError(undefined, "Character ID is required");

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
        igdb_id,
        main_image,
        background_image,
        background_color,
        gender_id,
        species_id,
        created_at,
        updated_at,
        character_translations(
          language_code,
          name,
          role,
          description,
          biography,
          weapons
        ),
        character_games(
          game_id,
          is_primary,
          games(
            id,
            slug,
            game_translations(title, language_code)
          )
        ),
        character_media(
          type,
          url,
          thumbnail_url,
          title,
          description,
          alt_text,
          is_featured,
          display_order
        ),
        character_relationships!character_relationships_character_id_fkey(
          related_character_id,
          relationship_type,
          description
        ),
        character_character_roles(
          role_id
        )
      `
    )
    .eq("id", characterId)
    .single();

  const character = data as CharacterDetailRow | null;

  if (error) {
    if (error.code === "PGRST116") throw notFound("Character not found");

    logger.error("Error fetching character details", { error });
    return NextResponse.json({ error: "Failed to fetch character details" }, { status: 500 });
  }

  if (!character) throw notFound("Character not found");

  return NextResponse.json({
    id: character.id,
    slug: character.slug,
    igdb_id: character.igdb_id ?? null,
    main_image: character.main_image,
    background_image: character.background_image,
    background_color: character.background_color,
    gender_id: character.gender_id ?? null,
    species_id: character.species_id ?? null,
    created_at: character.created_at,
    updated_at: character.updated_at,
    translations: character.character_translations || [],
    games: character.character_games || [],
    relationships: character.character_relationships || [],
    media: character.character_media || [],
    role_ids: (character.character_character_roles || []).map((r) => r.role_id),
  });
});

/** PUT /api/admin/characters/[id] - Full update with relation replacement */
export const PUT = defineRoute(
  { auth: "admin", body: adminCharacterFormSchema },
  async ({ params, body }) => {
    const { id: characterId } = params;

    if (!characterId) throw validationError(undefined, "Character ID is required");

    const payload = characterFormToPayload(body);
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

    if (checkError || !existing) throw notFound("Character not found");

    // Update main character data
    const { error: updateError } = await db
      .from("characters")
      .update({
        slug: payload.character.slug,
        main_image: payload.character.main_image,
        background_image: payload.character.background_image,
        background_color: payload.character.background_color,
        gender_id: payload.character.gender_id,
        species_id: payload.character.species_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    if (updateError) {
      if (updateError.code === "23505") {
        throw validationError(undefined, "Character with this slug already exists");
      }

      logger.error("Error updating character", { error: updateError });
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
        logger.error("Error updating translations", { error: translationsError });
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
        logger.error("Error updating game relations", { error: gamesError });
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
        logger.error("Error updating media", { error: mediaError });
        return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
      }
    }

    // Replace relationships
    await db.from("character_relationships").delete().eq("character_id", characterId);

    if (payload.relationships.length > 0) {
      const relationshipsWithId = payload.relationships.map((r) => ({
        ...r,
        character_id: characterId,
      }));
      const { error: relationshipsError } = await db
        .from("character_relationships")
        .insert(relationshipsWithId);

      if (relationshipsError) {
        logger.error("Error updating relationships", { error: relationshipsError });
        return NextResponse.json({ error: "Failed to update relationships" }, { status: 500 });
      }
    }

    // Replace role associations
    await db.from("character_character_roles").delete().eq("character_id", characterId);

    if (payload.role_ids.length > 0) {
      const roleRows = payload.role_ids.map((role_id) => ({
        character_id: characterId,
        role_id,
      }));
      const { error: rolesError } = await db.from("character_character_roles").insert(roleRows);

      if (rolesError) {
        logger.error("Error updating role associations", { error: rolesError });
        return NextResponse.json({ error: "Failed to update role associations" }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Character updated successfully",
      characterId,
    });
  }
);

/** DELETE /api/admin/characters/[id] - Delete with cascade */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id: characterId } = params;

  if (!characterId) throw validationError(undefined, "Character ID is required");

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

  if (checkError || !existing) throw notFound("Character not found");

  // CASCADE will handle all related data
  const { error: deleteError } = await db.from("characters").delete().eq("id", characterId);

  if (deleteError) {
    logger.error("Error deleting character", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete character" }, { status: 500 });
  }

  return NextResponse.json({
    message: "Character deleted successfully",
    characterId,
    slug: existing.slug,
  });
});
