import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { pickTranslationWithName } from "@/lib/utils/pickTranslation";
import { logger } from "@/lib/logger";
import {
  fetchGenderSpeciesIds,
  fetchGender,
  fetchSpecies,
  fetchRelationships,
  buildGames,
  buildMedia,
  buildPlatforms,
} from "./helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { slug: characterSlug } = await params;

    if (!characterSlug) {
      return NextResponse.json({ error: "Character slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types (database.types.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Main query — core character data with known relations
    const { data: character, error } = await db
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
          language_code,
          name,
          role,
          description,
          biography,
          weapons
        ),
        character_games(
          is_primary,
          games(
            id,
            slug,
            cover_image_url,
            background_image_url,
            release_date,
            game_translations(
              title
            ),
            game_platforms(
              platforms(
                id,
                slug,
                icon_url,
                platform_translations(
                  name,
                  abbreviation,
                  language_code
                )
              )
            )
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
      .eq("slug", characterSlug)
      .single();

    if (error) {
      logger.error("Error fetching character details by slug", { error });
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Character not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch character details" }, { status: 500 });
    }

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Debug: log translation availability to help diagnose missing data
    logger.info("Character fetched", {
      slug: character.slug,
      translations: character.character_translations,
      gamesCount: character.character_games?.length ?? 0,
    });

    // Fetch gender/species IDs separately (columns added by migration,
    // may not exist yet — graceful fallback to undefined)
    const genderSpeciesIds = await fetchGenderSpeciesIds(supabase, character.id);

    // Fetch gender, species, and relationships in parallel
    const [genderObj, speciesObj, relationships] = await Promise.all([
      fetchGender(supabase, genderSpeciesIds?.genderId ?? null, locale),
      fetchSpecies(supabase, genderSpeciesIds?.speciesId ?? null, locale),
      fetchRelationships(supabase, character.id, locale),
    ]);

    const translation = pickTranslationWithName(
      character.character_translations as {
        language_code: string;
        name?: string | null;
        role?: string | null;
        description?: string | null;
        biography?: string | null;
        weapons?: string | null;
      }[],
      locale
    );
    const games = buildGames(character.character_games);
    const primaryGame = games.find((g) => g.isPrimary)?.title || games[0]?.title || undefined;

    const transformedCharacter = {
      id: character.id,
      slug: character.slug,
      name: translation?.name || character.slug,
      role: translation?.role,
      description: translation?.description,
      biography: translation?.biography,
      weapons: translation?.weapons,
      backgroundColor: character.background_color || "#0f172a",
      ...(genderObj && { gender: genderObj }),
      ...(speciesObj && { species: speciesObj }),
      games,
      primaryGame,
      media: buildMedia(character),
      relationships,
      platforms: buildPlatforms(character.character_games, locale),
      createdAt: character.created_at,
      updatedAt: character.updated_at,
    };

    return NextResponse.json(transformedCharacter);
  } catch (error) {
    logger.error("Error in character details API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
