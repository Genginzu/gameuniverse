import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { updateGameSchema } from "@/lib/validations/game";
import {
  notifyGameUpdated,
  notifyGameDeleted,
  invalidateGameCache,
  verifyGameDeletionConsistency,
} from "@/lib/realtime-updates";

// Types for Supabase query results
interface AdminGameGenre {
  genre_id: string;
  genres?: {
    id: string;
    slug: string;
    genre_translations?: Array<{ name: string; language_code: string }>;
  };
}

interface AdminGameCompany {
  id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    website_url?: string;
  };
}

interface AdminGamePrice {
  id: string;
  store_id: string;
  price: number;
  currency: string;
  platform: string;
  store_url?: string;
  is_available: boolean;
  last_updated?: string;
  stores?: {
    id: string;
    name: string;
    logo_url?: string;
    website_url?: string;
  };
}

/**
 * GET /api/admin/games/[id] - Get detailed game data for admin editing
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    await requireAdmin();

    const { id: gameId } = await params;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch complete game data for editing
    const { data: game, error } = await supabase
      .from("games")
      .select(
        `
        id,
        slug,
        cover_image_url,
        background_image_url,
        release_date,
        metascore,
        playtime_hastily,
        playtime_normally,
        playtime_completely,
        system_requirements,
        created_at,
        updated_at,
        game_translations(
          id,
          language_code,
          title,
          description
        ),
        game_genres(
          genre_id,
          genres(
            id,
            slug,
            genre_translations(
              name,
              language_code
            )
          )
        ),
        game_companies(
          id,
          company_id,
          role,
          is_primary,
          companies(
            id,
            name,
            slug,
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
        game_prices(
          id,
          store_id,
          price,
          currency,
          platform,
          store_url,
          is_available,
          last_updated,
          stores(
            id,
            name,
            logo_url,
            website_url
          )
        ),
        game_ratings(
          id,
          rating_id,
          is_primary,
          assigned_date,
          game_rating_descriptors(
            content_descriptor_id
          )
        ),
        game_versions(
          id,
          version_title,
          description,
          cover_image_url,
          display_order
        ),
        game_languages(
          id,
          language_code,
          language_name,
          has_audio,
          has_subtitles,
          has_interface
        )
      `
      )
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("Error fetching admin game details:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      return NextResponse.json({ error: "Failed to fetch game details" }, { status: 500 });
    }

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Transform data for admin editing
    const adminGameData = {
      id: game.id,
      slug: game.slug,
      cover_image_url: game.cover_image_url,
      background_image_url: game.background_image_url,
      release_date: game.release_date,
      metascore: game.metascore,
      playtime_hastily: game.playtime_hastily ?? null,
      playtime_normally: game.playtime_normally ?? null,
      playtime_completely: game.playtime_completely ?? null,
      system_requirements: game.system_requirements,
      created_at: game.created_at,
      updated_at: game.updated_at,
      translations: game.game_translations || [],
      genres:
        (game.game_genres as AdminGameGenre[] | undefined)?.map((gg) => ({
          genre_id: gg.genre_id,
          genre: {
            id: gg.genres?.id,
            slug: gg.genres?.slug,
            name: gg.genres?.genre_translations?.[0]?.name || "Unknown",
          },
        })) || [],
      companies:
        (game.game_companies as AdminGameCompany[] | undefined)?.map((gc) => ({
          id: gc.id,
          company_id: gc.company_id,
          role: gc.role,
          is_primary: gc.is_primary,
          company: {
            id: gc.companies?.id,
            name: gc.companies?.name,
            slug: gc.companies?.slug,
            website_url: gc.companies?.website_url,
          },
        })) || [],
      screenshots: game.game_screenshots || [],
      artwork: game.game_artwork || [],
      videos: game.game_videos || [],
      prices:
        (game.game_prices as AdminGamePrice[] | undefined)?.map((gp) => ({
          ...gp,
          store: gp.stores,
        })) || [],
      game_ratings:
        (
          game.game_ratings as
            | Array<{
                id: string;
                rating_id: string;
                is_primary: boolean;
                assigned_date: string | null;
                game_rating_descriptors: Array<{ content_descriptor_id: string }>;
              }>
            | undefined
        )?.map((gr) => ({
          rating_id: gr.rating_id,
          is_primary: gr.is_primary ?? false,
          content_descriptors: (gr.game_rating_descriptors ?? []).map(
            (d) => d.content_descriptor_id
          ),
        })) || [],
      versions:
        (game.game_versions as
          | Array<{
              id: string;
              version_title: string;
              description: string | null;
              cover_image_url: string | null;
              display_order: number | null;
            }>
          | undefined) ?? [],
      languages:
        (game.game_languages as
          | Array<{
              id: string;
              language_code: string;
              language_name: string;
              has_audio: boolean;
              has_subtitles: boolean;
              has_interface: boolean;
            }>
          | undefined) ?? [],
    };

    return NextResponse.json(adminGameData);
  } catch (error) {
    console.error("Error in admin game GET:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/games/[id] - Update a game
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    await requireAdmin();

    const { id: gameId } = await params;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input data
    const validationResult = updateGameSchema.safeParse({ id: gameId, ...body });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      game,
      translations,
      companies,
      genres,
      screenshots,
      artwork,
      videos,
      prices,
      age_ratings,
      versions,
      languages,
    } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if game exists
    const { data: existingGame, error: checkError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .single();

    if (checkError || !existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Update main game data if provided
    if (game && Object.keys(game).length > 0) {
      const { error: gameError } = await supabase
        .from("games")
        .update({ ...game, updated_at: new Date().toISOString() })
        .eq("id", gameId);

      if (gameError) {
        console.error("Error updating game:", gameError);

        if (gameError.code === "23505") {
          // Unique constraint violation
          return NextResponse.json(
            { error: "Game with this slug already exists" },
            { status: 409 }
          );
        }

        return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
      }
    }

    // Update translations if provided
    if (translations) {
      // Delete existing translations and insert new ones
      await supabase.from("game_translations").delete().eq("game_id", gameId);

      if (translations.length > 0) {
        const translationsWithGameId = translations.map((t) => ({ ...t, game_id: gameId }));
        const { error: translationsError } = await supabase
          .from("game_translations")
          .insert(translationsWithGameId);

        if (translationsError) {
          console.error("Error updating translations:", translationsError);
          return NextResponse.json({ error: "Failed to update translations" }, { status: 500 });
        }
      }
    }

    // Update companies if provided
    if (companies) {
      await supabase.from("game_companies").delete().eq("game_id", gameId);

      if (companies.length > 0) {
        const companiesWithGameId = companies.map((c) => ({ ...c, game_id: gameId }));
        const { error: companiesError } = await supabase
          .from("game_companies")
          .insert(companiesWithGameId);

        if (companiesError) {
          console.error("Error updating companies:", companiesError);
          return NextResponse.json({ error: "Failed to update companies" }, { status: 500 });
        }
      }
    }

    // Update genres if provided
    if (genres) {
      await supabase.from("game_genres").delete().eq("game_id", gameId);

      if (genres.length > 0) {
        const genresWithGameId = genres.map((g) => ({ ...g, game_id: gameId }));
        const { error: genresError } = await supabase.from("game_genres").insert(genresWithGameId);

        if (genresError) {
          console.error("Error updating genres:", genresError);
          return NextResponse.json({ error: "Failed to update genres" }, { status: 500 });
        }
      }
    }

    // Update media if provided
    if (screenshots) {
      await supabase.from("game_screenshots").delete().eq("game_id", gameId);

      if (screenshots.length > 0) {
        const screenshotsWithGameId = screenshots.map((s) => ({ ...s, game_id: gameId }));
        const { error: screenshotsError } = await supabase
          .from("game_screenshots")
          .insert(screenshotsWithGameId);

        if (screenshotsError) {
          console.warn("Error updating screenshots:", screenshotsError);
        }
      }
    }

    if (artwork) {
      await supabase.from("game_artwork").delete().eq("game_id", gameId);

      if (artwork.length > 0) {
        const artworkWithGameId = artwork.map((a) => ({ ...a, game_id: gameId }));
        const { error: artworkError } = await supabase
          .from("game_artwork")
          .insert(artworkWithGameId);

        if (artworkError) {
          console.warn("Error updating artwork:", artworkError);
        }
      }
    }

    if (videos) {
      await supabase.from("game_videos").delete().eq("game_id", gameId);

      if (videos.length > 0) {
        const videosWithGameId = videos.map((v) => ({ ...v, game_id: gameId }));
        const { error: videosError } = await supabase.from("game_videos").insert(videosWithGameId);

        if (videosError) {
          console.warn("Error updating videos:", videosError);
        }
      }
    }

    // Update prices if provided
    if (prices) {
      await supabase.from("game_prices").delete().eq("game_id", gameId);

      if (prices.length > 0) {
        const pricesWithGameId = prices.map((p) => ({ ...p, game_id: gameId }));
        const { error: pricesError } = await supabase.from("game_prices").insert(pricesWithGameId);

        if (pricesError) {
          console.warn("Error updating prices:", pricesError);
        }
      }
    }

    // Update age ratings if provided
    if (age_ratings) {
      // Delete existing descriptors first (via cascade or manually)
      const { data: existingRatings } = await supabase
        .from("game_ratings")
        .select("id")
        .eq("game_id", gameId);

      if (existingRatings && existingRatings.length > 0) {
        const ratingIds = existingRatings.map((r) => r.id);
        await supabase.from("game_rating_descriptors").delete().in("game_rating_id", ratingIds);
      }

      await supabase.from("game_ratings").delete().eq("game_id", gameId);

      if (age_ratings.length > 0) {
        const ratingsWithGameId = age_ratings.map((r) => ({
          game_id: gameId,
          rating_id: r.rating_id,
          is_primary: r.is_primary,
        }));
        const { data: insertedRatings, error: ratingsError } = await supabase
          .from("game_ratings")
          .insert(ratingsWithGameId)
          .select("id, rating_id");

        if (ratingsError) {
          console.warn("Error updating age ratings:", ratingsError);
        } else if (insertedRatings) {
          // Insert content descriptors for each rating
          const descriptorRows: { game_rating_id: string; content_descriptor_id: string }[] = [];
          for (const inserted of insertedRatings) {
            const original = age_ratings.find((r) => r.rating_id === inserted.rating_id);
            if (original?.content_descriptors?.length) {
              for (const descriptorId of original.content_descriptors) {
                descriptorRows.push({
                  game_rating_id: inserted.id,
                  content_descriptor_id: descriptorId,
                });
              }
            }
          }
          if (descriptorRows.length > 0) {
            const { error: descriptorsError } = await supabase
              .from("game_rating_descriptors")
              .insert(descriptorRows);
            if (descriptorsError) {
              console.warn("Error updating rating descriptors:", descriptorsError);
            }
          }
        }
      }
    }

    // Update versions if provided
    if (versions) {
      await (supabase.from("game_versions") as ReturnType<typeof supabase.from>)
        .delete()
        .eq("game_id", gameId);

      if (versions.length > 0) {
        const versionsWithGameId = versions.map((v) => ({
          ...v,
          game_id: gameId,
          igdb_id: 0,
        }));
        const { error: versionsError } = await (
          supabase.from("game_versions") as ReturnType<typeof supabase.from>
        ).insert(versionsWithGameId);

        if (versionsError) {
          console.warn("Error updating versions:", versionsError);
        }
      }
    }

    // Update languages if provided
    if (languages) {
      await supabase.from("game_languages").delete().eq("game_id", gameId);

      if (languages.length > 0) {
        const languagesWithGameId = languages.map((l) => ({
          ...l,
          game_id: gameId,
        }));
        const { error: languagesError } = await supabase
          .from("game_languages")
          .insert(languagesWithGameId);

        if (languagesError) {
          console.warn("Error updating languages:", languagesError);
        }
      }
    }

    // Send real-time notification for successful update
    await notifyGameUpdated(gameId);
    await invalidateGameCache(gameId);

    return NextResponse.json({
      message: "Game updated successfully",
      gameId,
    });
  } catch (error) {
    console.error("Error in admin game PUT:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/games/[id] - Delete a game with complete cleanup
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    await requireAdmin();

    const { id: gameId } = await params;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Check if game exists and get complete information for cleanup verification
    const { data: existingGame, error: checkError } = await supabase
      .from("games")
      .select(
        `
        id,
        slug,
        game_translations(count),
        game_genres(count),
        game_companies(count),
        game_screenshots(count),
        game_artwork(count),
        game_videos(count),
        game_prices(count)
      `
      )
      .eq("id", gameId)
      .single();

    if (checkError || !existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Log what will be deleted for audit purposes
    const relatedDataCounts = {
      translations: existingGame.game_translations?.[0]?.count || 0,
      genres: existingGame.game_genres?.[0]?.count || 0,
      companies: existingGame.game_companies?.[0]?.count || 0,
      screenshots: existingGame.game_screenshots?.[0]?.count || 0,
      artwork: existingGame.game_artwork?.[0]?.count || 0,
      videos: existingGame.game_videos?.[0]?.count || 0,
      prices: existingGame.game_prices?.[0]?.count || 0,
    };

    console.warn(
      `Deleting game ${existingGame.slug} (${gameId}) with related data:`,
      relatedDataCounts
    );

    // Perform the deletion (CASCADE will handle all related data)
    const { error: deleteError } = await supabase.from("games").delete().eq("id", gameId);

    if (deleteError) {
      console.error("Error deleting game:", deleteError);
      return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
    }

    // Verify complete deletion using the consistency check function
    const consistencyCheck = await verifyGameDeletionConsistency([gameId], supabase);

    if (!consistencyCheck.isConsistent) {
      console.warn(
        `Warning: Deletion consistency issues detected for game ${gameId}:`,
        consistencyCheck.inconsistencies
      );
    }

    // Send real-time notification for successful deletion
    await notifyGameDeleted(gameId, existingGame.slug);
    await invalidateGameCache(gameId);

    // Enhanced response with deletion summary
    return NextResponse.json({
      message: "Game deleted successfully with complete cleanup",
      gameId,
      slug: existingGame.slug,
      deletionSummary: {
        relatedDataCounts,
        consistencyCheck,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in admin game DELETE:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
