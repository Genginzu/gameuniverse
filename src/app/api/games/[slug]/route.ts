import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const { slug: gameSlug } = await params;

    if (!gameSlug) {
      return NextResponse.json({ error: "Game slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch game details by slug with all related data
    const { data: game, error } = await supabase
      .from("games")
      .select(
        `
        id,
        slug,
        cover_image_url,
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
      .single();

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

    // Transform the data to match the expected format
    const translation = game.game_translations?.[0];

    // Process genres
    const genres =
      game.game_genres?.map((gg: any) => ({
        id: gg.genres?.id,
        slug: gg.genres?.slug,
        name: gg.genres?.genre_translations?.[0]?.name || "Unknown",
        description: gg.genres?.genre_translations?.[0]?.description,
      })) || [];

    // Process companies
    const companies = {
      developers:
        game.game_companies
          ?.filter((gc: any) => gc.role === "developer")
          .map((gc: any) => ({
            id: gc.companies?.id,
            name: gc.companies?.name,
            slug: gc.companies?.slug,
            description: gc.companies?.description,
            websiteUrl: gc.companies?.website_url,
            isPrimary: gc.is_primary,
          })) || [],
      publishers:
        game.game_companies
          ?.filter((gc: any) => gc.role === "publisher")
          .map((gc: any) => ({
            id: gc.companies?.id,
            name: gc.companies?.name,
            slug: gc.companies?.slug,
            description: gc.companies?.description,
            websiteUrl: gc.companies?.website_url,
            isPrimary: gc.is_primary,
          })) || [],
    };

    // Get primary developer and publisher for backward compatibility
    const primaryDeveloper =
      companies.developers.find((dev) => dev.isPrimary) || companies.developers[0];
    const primaryPublisher =
      companies.publishers.find((pub) => pub.isPrimary) || companies.publishers[0];

    // Process media
    const media = {
      coverImage: game.cover_image_url,
      screenshots:
        game.game_screenshots
          ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((screenshot: any) => ({
            id: screenshot.id,
            url: screenshot.url,
            altText: screenshot.alt_text,
            caption: screenshot.caption,
            isFeatured: screenshot.is_featured,
          })) || [],
      artwork:
        game.game_artwork
          ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((art: any) => ({
            id: art.id,
            url: art.url,
            altText: art.alt_text,
            caption: art.caption,
            type: art.artwork_type,
            isFeatured: art.is_featured,
          })) || [],
      videos:
        game.game_videos
          ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((video: any) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnail_url,
            type: video.video_type,
            duration: video.duration_seconds,
            isFeatured: video.is_featured,
          })) || [],
    };

    // Process ratings
    const primaryRating = game.game_ratings?.find((gr: any) => gr.is_primary);
    const ageRating = primaryRating
      ? {
          system: primaryRating.ratings?.rating_systems?.name,
          systemCode: primaryRating.ratings?.rating_systems?.code,
          rating: primaryRating.ratings?.display_name,
          ratingCode: primaryRating.ratings?.code,
          minimumAge: primaryRating.ratings?.minimum_age,
          colorHex: primaryRating.ratings?.color_hex,
          iconUrl: primaryRating.ratings?.icon_url,
          assignedDate: primaryRating.assigned_date,
          contentDescriptors:
            primaryRating.game_rating_descriptors?.map((grd: any) => ({
              code: grd.content_descriptors?.code,
              name: grd.content_descriptors?.content_descriptor_translations?.[0]?.name,
              description:
                grd.content_descriptors?.content_descriptor_translations?.[0]?.description,
            })) || [],
        }
      : null;

    // Process pricing
    const pricing =
      game.game_prices
        ?.filter((gp: any) => gp.is_available)
        .map((price: any) => ({
          price: price.price,
          currency: price.currency,
          platform: price.platform,
          lastUpdated: price.last_updated,
          storeUrl: price.store_url,
          store: {
            name: price.stores?.name,
            logoUrl: price.stores?.logo_url,
            websiteUrl: price.stores?.website_url,
          },
        })) || [];

    const transformedGame = {
      id: game.id,
      slug: game.slug,
      title: translation?.title || "Untitled",
      description: translation?.description,
      releaseDate: game.release_date,
      releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : null,
      metascore: game.metascore,
      systemRequirements: game.system_requirements,
      genres,
      companies,
      developer: primaryDeveloper?.name || "Unknown",
      publisher: primaryPublisher?.name || "Unknown",
      media,
      ageRating,
      pricing,
      createdAt: game.created_at,
      updatedAt: game.updated_at,
    };

    return NextResponse.json(transformedGame);
  } catch (error) {
    console.error("Unexpected error in game details API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
