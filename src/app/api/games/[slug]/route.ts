import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  DatabaseGameGenre,
  DatabaseGameCompanyRelation,
  DatabaseGameScreenshot,
  DatabaseGameArtwork,
  DatabaseGameVideo,
  DatabaseGameRating,
  DatabaseGamePrice,
  DatabaseGameData,
} from "@/types/database";
import { SupabaseError } from "@/types/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { slug: gameSlug } = await params;

    if (!gameSlug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch game details by slug with all related data (except languages which may not exist)
    const { data: game, error } = (await supabase
      .from("games")
      .select(
        `
        id,
        slug,
        cover_image_url,
        background_image_url,
        background_color,
        release_date,
        metascore,
        system_requirements,
        created_at,
        updated_at,
        game_translations!inner(
          title,
          description
        ),
        game_genres(
          genres(
            id,
            slug,
            genre_translations(
              name,
              description
            )
          )
        ),
        game_companies(
          role,
          is_primary,
          companies(
            id,
            name,
            slug,
            description,
            website_url
          )
        ),
        game_screenshots(
          id,
          url,
          alt_text,
          caption,
          display_order,
          is_featured
        ),
        game_artwork(
          id,
          url,
          alt_text,
          caption,
          artwork_type,
          display_order,
          is_featured
        ),
        game_videos(
          id,
          title,
          description,
          url,
          thumbnail_url,
          video_type,
          duration_seconds,
          display_order,
          is_featured
        ),
        game_ratings(
          is_primary,
          assigned_date,
          ratings(
            code,
            display_name,
            minimum_age,
            color_hex,
            icon_url,
            rating_systems(
              name,
              code
            )
          ),
          game_rating_descriptors(
            content_descriptors(
              code,
              content_descriptor_translations(
                name,
                description
              )
            )
          )
        ),
        game_prices(
          price,
          currency,
          platform,
          is_available,
          last_updated,
          store_url,
          stores(
            name,
            logo_url,
            website_url
          )
        )
      `
      )
      .eq("game_translations.language_code", locale)
      .eq("game_genres.genres.genre_translations.language_code", locale)
      .eq(
        "game_ratings.game_rating_descriptors.content_descriptors.content_descriptor_translations.language_code",
        locale
      )
      .eq("slug", gameSlug)
      .single()) as { data: DatabaseGameData | null; error: SupabaseError | null };

    if (error) {
      console.error("Error fetching game details by slug:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch game details" }, { status: 500 });
    }

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch languages separately (table may not exist yet)
    let gameLanguages: Array<{
      language_code: string;
      language_name: string;
      has_audio: boolean;
      has_subtitles: boolean;
      has_interface: boolean;
    }> = [];

    try {
      const { data: langData } = await supabase
        .from("game_languages")
        .select("language_code, language_name, has_audio, has_subtitles, has_interface")
        .eq("game_id", game.id);

      if (langData) {
        gameLanguages = langData.map((lang) => ({
          language_code: lang.language_code,
          language_name: lang.language_name,
          has_audio: lang.has_audio ?? false,
          has_subtitles: lang.has_subtitles ?? false,
          has_interface: lang.has_interface ?? false,
        }));
      }
    } catch {
      // Table may not exist yet, ignore error
      console.warn("game_languages table not available yet");
    }

    // Fetch playtime separately (columns may not exist yet)
    let gamePlaytime: {
      playtime_hastily: number | null;
      playtime_normally: number | null;
      playtime_completely: number | null;
      playtime_updated_at: string | null;
    } | null = null;

    try {
      const { data: playtimeData } = await supabase
        .from("games")
        .select("playtime_hastily, playtime_normally, playtime_completely, playtime_updated_at")
        .eq("id", game.id)
        .single();

      if (playtimeData) {
        gamePlaytime = {
          playtime_hastily: playtimeData.playtime_hastily ?? null,
          playtime_normally: playtimeData.playtime_normally ?? null,
          playtime_completely: playtimeData.playtime_completely ?? null,
          playtime_updated_at: playtimeData.playtime_updated_at ?? null,
        };
      }
    } catch {
      // Columns may not exist yet, ignore error
      console.warn("playtime columns not available yet");
    }

    // Fetch game versions (Requirements 5.1)
    let gameVersions: Array<{
      id: string;
      igdb_id: number;
      version_title: string;
      description: string | null;
      cover_image_url: string | null;
    }> = [];

    try {
      const { data: versionsData } = await supabase
        .from("game_versions")
        .select("id, igdb_id, version_title, description, cover_image_url")
        .eq("game_id", game.id)
        .order("display_order", { ascending: true });

      if (versionsData) {
        gameVersions = versionsData;
      }
    } catch {
      // Table may not exist yet, ignore error
      console.warn("game_versions table not available yet");
    }

    // Transform the data to match the expected format
    const translation = game.game_translations?.[0];

    // Process genres
    const genres =
      game.game_genres?.map((gg: { genres: DatabaseGameGenre }) => ({
        id: gg.genres?.id,
        slug: gg.genres?.slug,
        name: gg.genres?.genre_translations?.[0]?.name || "Unknown",
        description: gg.genres?.genre_translations?.[0]?.description,
      })) || [];

    // Process companies
    const companies = {
      developers:
        game.game_companies
          ?.filter((gc: DatabaseGameCompanyRelation) => gc.role === "developer")
          .map((gc: DatabaseGameCompanyRelation) => ({
            id: gc.companies?.id,
            name: gc.companies?.name,
            slug: gc.companies?.slug,
            description: gc.companies?.description,
            websiteUrl: gc.companies?.website_url,
            isPrimary: gc.is_primary || false,
          })) || [],
      publishers:
        game.game_companies
          ?.filter((gc: DatabaseGameCompanyRelation) => gc.role === "publisher")
          .map((gc: DatabaseGameCompanyRelation) => ({
            id: gc.companies?.id,
            name: gc.companies?.name,
            slug: gc.companies?.slug,
            description: gc.companies?.description,
            websiteUrl: gc.companies?.website_url,
            isPrimary: gc.is_primary || false,
          })) || [],
    };

    // Get primary developer and publisher for backward compatibility
    const primaryDeveloper =
      companies.developers.find((dev: { isPrimary: boolean }) => dev.isPrimary) ||
      companies.developers[0];
    const primaryPublisher =
      companies.publishers.find((pub: { isPrimary: boolean }) => pub.isPrimary) ||
      companies.publishers[0];

    // Process media
    const media = {
      coverImage: game.cover_image_url,
      backgroundImage: game.background_image_url,
      screenshots:
        game.game_screenshots
          ?.sort(
            (a: DatabaseGameScreenshot, b: DatabaseGameScreenshot) =>
              (a.display_order || 0) - (b.display_order || 0)
          )
          .map((screenshot: DatabaseGameScreenshot) => ({
            id: screenshot.id,
            url: screenshot.url,
            altText: screenshot.alt_text,
            caption: screenshot.caption,
            isFeatured: screenshot.is_featured || false,
          })) || [],
      artwork:
        game.game_artwork
          ?.sort(
            (a: DatabaseGameArtwork, b: DatabaseGameArtwork) =>
              (a.display_order || 0) - (b.display_order || 0)
          )
          .map((art: DatabaseGameArtwork) => ({
            id: art.id,
            url: art.url,
            altText: art.alt_text,
            caption: art.caption,
            type: art.artwork_type || "unknown",
            isFeatured: art.is_featured || false,
          })) || [],
      videos:
        game.game_videos
          ?.sort(
            (a: DatabaseGameVideo, b: DatabaseGameVideo) =>
              (a.display_order || 0) - (b.display_order || 0)
          )
          .map((video: DatabaseGameVideo) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnail_url,
            type: video.video_type || "unknown",
            duration: video.duration_seconds,
            isFeatured: video.is_featured || false,
          })) || [],
    };

    // Process ratings - get all ratings, not just primary
    const processRating = (gr: DatabaseGameRating) => ({
      system: gr.ratings?.rating_systems?.name,
      systemCode: gr.ratings?.rating_systems?.code,
      rating: gr.ratings?.display_name,
      ratingCode: gr.ratings?.code,
      minimumAge: gr.ratings?.minimum_age,
      colorHex: gr.ratings?.color_hex,
      iconUrl: gr.ratings?.icon_url,
      assignedDate: gr.assigned_date,
      isPrimary: gr.is_primary,
      contentDescriptors:
        gr.game_rating_descriptors?.map(
          (grd: {
            content_descriptors: {
              code: string;
              content_descriptor_translations: Array<{
                name: string;
                description: string | null;
              }>;
            };
          }) => ({
            code: grd.content_descriptors?.code,
            name: grd.content_descriptors?.content_descriptor_translations?.[0]?.name,
            description: grd.content_descriptors?.content_descriptor_translations?.[0]?.description,
          })
        ) || [],
    });

    // Sort ratings: PEGI first, then by system name
    const gameRatingsArray = game.game_ratings || [];
    const sortedGameRatings =
      gameRatingsArray.length > 0
        ? [...gameRatingsArray].sort((a: DatabaseGameRating, b: DatabaseGameRating) => {
            const aCode = a.ratings?.rating_systems?.code?.toUpperCase() || "";
            const bCode = b.ratings?.rating_systems?.code?.toUpperCase() || "";
            // PEGI comes first
            if (aCode === "PEGI" && bCode !== "PEGI") return -1;
            if (bCode === "PEGI" && aCode !== "PEGI") return 1;
            // Then alphabetically by system code
            return aCode.localeCompare(bCode);
          })
        : [];

    const ageRatings = sortedGameRatings.map((gr: DatabaseGameRating) => processRating(gr));
    const primaryRating = gameRatingsArray.find((gr: DatabaseGameRating) => gr.is_primary);
    const ageRating = primaryRating ? processRating(primaryRating) : null;

    // Process pricing
    const pricing =
      game.game_prices
        ?.filter((gp: DatabaseGamePrice) => gp.is_available)
        .map((price: DatabaseGamePrice) => ({
          price: price.price,
          currency: price.currency,
          platform: price.platform,
          lastUpdated: price.last_updated || "",
          storeUrl: price.store_url,
          store: {
            name: price.stores?.name,
            logoUrl: price.stores?.logo_url,
            websiteUrl: price.stores?.website_url,
          },
        })) || [];

    // Process languages from separate query
    const languages = gameLanguages.map((lang) => ({
      code: lang.language_code,
      name: lang.language_name,
      hasAudio: lang.has_audio || false,
      hasSubtitles: lang.has_subtitles || false,
      hasInterface: lang.has_interface || false,
    }));

    // Process playtime (may be null if columns don't exist or not yet fetched)
    const playtime =
      gamePlaytime &&
      (gamePlaytime.playtime_hastily ||
        gamePlaytime.playtime_normally ||
        gamePlaytime.playtime_completely)
        ? {
            hastily: gamePlaytime.playtime_hastily,
            normally: gamePlaytime.playtime_normally,
            completely: gamePlaytime.playtime_completely,
            lastUpdated: gamePlaytime.playtime_updated_at,
          }
        : null;

    // Process versions - map to GameVersion format (Requirements 5.2, 5.3)
    const versions = gameVersions.map((v) => ({
      id: v.id,
      igdbId: v.igdb_id,
      title: v.version_title,
      description: v.description,
      coverImageUrl: v.cover_image_url,
    }));

    const transformedGame = {
      id: game.id,
      slug: game.slug,
      title: translation?.title || "Untitled",
      description: translation?.description,
      releaseDate: game.release_date,
      releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : null,
      metascore: game.metascore,
      backgroundColor: game.background_color,
      systemRequirements: game.system_requirements,
      genres,
      companies,
      developer: primaryDeveloper?.name || "Unknown",
      publisher: primaryPublisher?.name || "Unknown",
      media,
      ageRating,
      ageRatings,
      pricing,
      languages,
      playtime,
      versions,
      createdAt: game.created_at,
      updatedAt: game.updated_at,
    };

    return NextResponse.json(transformedGame);
  } catch (error) {
    console.error("Unexpected error in game details API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
