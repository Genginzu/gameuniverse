import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { slug: characterSlug } = await params;

    if (!characterSlug) {
      return NextResponse.json({ error: "Character slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch character details by slug with all related data
    const { data: character, error } = await supabase
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
        character_translations!inner(
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
      .eq("character_translations.language_code", locale)
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

    // Cast character to access properties (TypeScript has trouble inferring complex nested types)
    const characterData = character as {
      id: string;
      slug: string;
      main_image: string | null;
      background_image: string | null;
      background_color: string | null;
      created_at: string | null;
      updated_at: string | null;
      character_translations: Array<{
        name: string;
        role: string | null;
        description: string | null;
        biography: string | null;
        weapons: string | null;
      }>;
      character_games: Array<{
        is_primary: boolean;
        games: {
          id: string;
          slug: string;
          cover_image_url: string | null;
          background_image_url: string | null;
          release_date: string | null;
          game_translations: Array<{ title: string }>;
        } | null;
      }>;
      character_media: Array<{
        id: string;
        type: string;
        url: string;
        thumbnail_url: string | null;
        title: string | null;
        description: string | null;
        alt_text: string | null;
        is_featured: boolean | null;
        display_order: number | null;
      }>;
    };

    // Fetch relationships separately to avoid complex join issues
    const { data: relationshipsData } = (await supabase
      .from("character_relationships")
      .select("id, relationship_type, description, related_character_id")
      .eq("character_id", characterData.id)) as {
      data: Array<{
        id: string;
        relationship_type: string;
        description: string | null;
        related_character_id: string;
      }> | null;
    };

    // Fetch related characters details if there are relationships
    let processedRelationships: Array<{
      id: string;
      relatedCharacter: {
        id: string;
        slug: string;
        name: string;
        mainImage: string | null;
        role: string | null;
      };
      relationshipType: string;
      description: string | null;
    }> = [];
    if (relationshipsData && relationshipsData.length > 0) {
      const relatedCharacterIds = relationshipsData.map((r) => r.related_character_id);

      const { data: relatedCharacters } = (await supabase
        .from("characters")
        .select(
          `
          id,
          slug,
          main_image,
          character_translations(name, role, language_code)
        `
        )
        .in("id", relatedCharacterIds)) as {
        data: Array<{
          id: string;
          slug: string;
          main_image: string | null;
          character_translations: Array<{
            name: string;
            role: string | null;
            language_code: string;
          }>;
        }> | null;
      };

      processedRelationships = relationshipsData
        .map((rel) => {
          const related = relatedCharacters?.find((c) => c.id === rel.related_character_id);
          if (!related) return null;

          const relatedTranslation =
            related.character_translations?.find((t) => t.language_code === locale) ||
            related.character_translations?.[0];

          return {
            id: rel.id,
            relatedCharacter: {
              id: related.id,
              slug: related.slug,
              name: relatedTranslation?.name || "Unknown",
              mainImage: related.main_image,
              role: relatedTranslation?.role ?? null,
            },
            relationshipType: rel.relationship_type,
            description: rel.description,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
    }

    // Transform the data to match the expected format
    const translation = characterData.character_translations?.[0];

    // Process games
    const games =
      characterData.character_games
        ?.map((cg) => ({
          id: cg.games?.id,
          slug: cg.games?.slug,
          title: cg.games?.game_translations?.[0]?.title || "Unknown",
          coverImage: cg.games?.cover_image_url,
          backgroundImage: cg.games?.background_image_url,
          releaseYear: cg.games?.release_date
            ? new Date(cg.games.release_date).getFullYear()
            : undefined,
          isPrimary: cg.is_primary || false,
        }))
        .sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.title.localeCompare(b.title);
        }) || [];

    const primaryGame = games.find((g) => g.isPrimary)?.title || games[0]?.title || "Unknown";

    // Process media
    const screenshots =
      characterData.character_media
        ?.filter((m) => m.type === "screenshot")
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((m) => ({
          id: m.id,
          url: m.url,
          altText: m.alt_text,
          caption: m.description,
          isFeatured: m.is_featured || false,
        })) || [];

    const artwork =
      characterData.character_media
        ?.filter((m) => m.type === "artwork")
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((m) => ({
          id: m.id,
          url: m.url,
          altText: m.alt_text,
          caption: m.description,
          type: m.title || "artwork",
          isFeatured: m.is_featured || false,
        })) || [];

    const videos =
      characterData.character_media
        ?.filter((m) => m.type === "video")
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((m) => ({
          id: m.id,
          title: m.title || "Video",
          description: m.description,
          url: m.url,
          thumbnailUrl: m.thumbnail_url,
          type: "video",
          isFeatured: m.is_featured || false,
        })) || [];

    const media = {
      mainImage: characterData.main_image,
      backgroundImage: characterData.background_image,
      screenshots,
      artwork,
      videos,
    };

    const transformedCharacter = {
      id: characterData.id,
      slug: characterData.slug,
      name: translation?.name || "Unnamed",
      role: translation?.role,
      description: translation?.description,
      biography: translation?.biography,
      weapons: translation?.weapons,
      backgroundColor: characterData.background_color || "#0f172a",
      games,
      primaryGame,
      media,
      relationships: processedRelationships,
      createdAt: characterData.created_at,
      updatedAt: characterData.updated_at,
    };

    return NextResponse.json(transformedCharacter);
  } catch (error) {
    logger.error("Error in character details API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
