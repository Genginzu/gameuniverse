import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-admin";
import { updateGameSchema } from "@/lib/validations/game";
import {
  notifyGameUpdated,
  notifyGameDeleted,
  invalidateGameCache,
  verifyGameDeletionConsistency,
} from "@/lib/realtime-updates";
import {
  detectChangedFields,
  upsertFieldOverrides,
  type SupabaseClientLike,
  type CurrentGameData,
} from "@/lib/utils/field-tracking";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import { logger } from "@/lib/logger";
import { invalidateForDeletedGame } from "@/lib/services/recommendation/cache";
import { untypedTable } from "@/lib/utils/untypedTable";

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
    const { data: game, error } = await untypedTable(supabase, "games")
      .select(
        `
        id,
        slug,
        igdb_id,
        cover_image_url,
        background_image_url,
        background_color,
        accent_color,
        label_color,
        text_color,
        release_date,
        metascore,
        playtime_hastily,
        playtime_normally,
        playtime_completely,
        system_requirements,
        created_at,
        updated_at,
        is_esport,
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
          display_order,
          game_version_translations(
            language_code,
            title,
            description
          )
        ),
        game_languages(
          id,
          language_code,
          language_name,
          has_audio,
          has_subtitles,
          has_interface
        ),
        game_platforms(
          platform_id,
          platforms(
            id,
            slug,
            platform_translations(
              name,
              language_code
            )
          )
        )
      `
      )
      .eq("id", gameId)
      .single();

    if (error) {
      logger.error("Error fetching admin game details", { error });

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
      igdb_id: game.igdb_id ?? null,
      cover_image_url: game.cover_image_url,
      background_image_url: game.background_image_url,
      background_color: game.background_color ?? null,
      accent_color: game.accent_color ?? null,
      label_color: game.label_color ?? null,
      text_color: game.text_color ?? null,
      release_date: game.release_date,
      metascore: game.metascore,
      playtime_hastily: game.playtime_hastily ?? null,
      playtime_normally: game.playtime_normally ?? null,
      playtime_completely: game.playtime_completely ?? null,
      system_requirements: game.system_requirements,
      created_at: game.created_at,
      updated_at: game.updated_at,
      is_esport: game.is_esport ?? false,
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
        (
          game.game_versions as
            | Array<{
                id: string;
                version_title: string;
                description: string | null;
                cover_image_url: string | null;
                display_order: number | null;
                game_version_translations?: Array<{
                  language_code: string;
                  title: string;
                  description: string | null;
                }>;
              }>
            | undefined
        )?.map((v) => ({
          ...v,
          translations: v.game_version_translations ?? [],
        })) ?? [],
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
      game_platforms:
        (
          game.game_platforms as
            | Array<{
                platform_id: string;
                platforms: {
                  id: string;
                  slug: string;
                  platform_translations: Array<{ name: string; language_code: string }>;
                } | null;
              }>
            | undefined
        )?.map((gp) => ({
          platform_id: gp.platform_id,
          platform: {
            id: gp.platforms?.id,
            slug: gp.platforms?.slug,
            name: gp.platforms?.platform_translations?.[0]?.name || gp.platforms?.slug || "Unknown",
          },
        })) || [],
    };

    // Fetch music data separately (table may not exist yet)
    try {
      const { data: musicData } = await (
        supabase.from("game_music") as ReturnType<typeof supabase.from>
      )
        .select("composer, spotify_embed_url, youtube_video_url")
        .eq("game_id", gameId)
        .single();

      if (musicData) {
        (adminGameData as Record<string, unknown>).music = musicData;
      }
    } catch {
      logger.warn("game_music table not available yet");
    }

    return NextResponse.json(adminGameData);
  } catch (error) {
    logger.error("Error in admin game GET", { error });

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
      logger.error("Game update validation failed", {
        gameId,
        issues: validationResult.error.issues,
      });
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
      music,
      game_platforms,
    } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Load current game data before updates (for field tracking comparison)
    const { data: existingGame, error: checkError } = await supabase
      .from("games")
      .select(
        `
        id, cover_image_url, background_image_url, release_date, metascore,
        playtime_hastily, playtime_normally, playtime_completely,
        game_translations(language_code, title, description),
        game_genres(genre_id),
        game_companies(company_id, role, is_primary),
        game_screenshots(url),
        game_artwork(url),
        game_ratings(rating_id, is_primary, game_rating_descriptors(content_descriptor_id)),
        game_versions(version_title, description),
        game_languages(language_code, has_audio, has_subtitles, has_interface),
        game_platforms(platform_id)
      `
      )
      .eq("id", gameId)
      .single();

    if (checkError || !existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Update main game data if provided
    if (game && Object.keys(game).length > 0) {
      const updatePayload = { ...game, updated_at: new Date().toISOString() };
      const { error: gameError } = await untypedTable(supabase, "games")
        .update(updatePayload)
        .eq("id", gameId);

      if (gameError) {
        logger.error("Error updating game", { error: gameError, gameId });

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
          logger.error("Error updating translations", { error: translationsError });
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
          logger.error("Error updating companies", { error: companiesError });
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
          logger.error("Error updating genres", { error: genresError });
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
          logger.warn("Error updating screenshots", { error: screenshotsError });
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
          logger.warn("Error updating artwork", { error: artworkError });
        }
      }
    }

    if (videos) {
      await supabase.from("game_videos").delete().eq("game_id", gameId);

      if (videos.length > 0) {
        const videosWithGameId = videos.map((v) => ({ ...v, game_id: gameId }));
        const { error: videosError } = await supabase.from("game_videos").insert(videosWithGameId);

        if (videosError) {
          logger.warn("Error updating videos", { error: videosError });
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
          logger.warn("Error updating prices", { error: pricesError });
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
          logger.warn("Error updating age ratings", { error: ratingsError });
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
              logger.warn("Error updating rating descriptors", { error: descriptorsError });
            }
          }
        }
      }
    }

    // Update versions if provided
    if (versions) {
      // Delete existing version translations first (cascade will handle it via FK)
      await (supabase.from("game_versions") as ReturnType<typeof supabase.from>)
        .delete()
        .eq("game_id", gameId);

      if (versions.length > 0) {
        for (const v of versions) {
          const { translations: versionTranslations, ...versionData } = v;
          const { data: inserted, error: versionError } = await (
            supabase.from("game_versions") as ReturnType<typeof supabase.from>
          )
            .insert({
              ...versionData,
              game_id: gameId,
              igdb_id: 0,
            })
            .select("id")
            .single();

          if (versionError || !inserted) {
            logger.warn("Error inserting version", { error: versionError });
            continue;
          }

          // Insert translations for this version
          if (versionTranslations && versionTranslations.length > 0) {
            const translationRows = versionTranslations
              .filter((t) => t.title || t.description)
              .map((t) => ({
                game_version_id: (inserted as { id: string }).id,
                language_code: t.language_code,
                title: t.title || "",
                description: t.description || null,
              }));

            if (translationRows.length > 0) {
              const { error: trError } = await (
                supabase.from("game_version_translations") as ReturnType<typeof supabase.from>
              ).insert(translationRows);

              if (trError) {
                logger.warn("Error inserting version translations", { error: trError });
              }
            }
          }
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
          logger.warn("Error updating languages", { error: languagesError });
        }
      }
    }

    // Update game platforms if provided
    if (game_platforms) {
      await supabase.from("game_platforms").delete().eq("game_id", gameId);

      if (game_platforms.length > 0) {
        const platformsWithGameId = game_platforms.map((p) => ({
          ...p,
          game_id: gameId,
        }));
        const { error: platformsError } = await supabase
          .from("game_platforms")
          .insert(platformsWithGameId);

        if (platformsError) {
          logger.warn("Error updating game platforms", { error: platformsError });
        }
      }
    }

    // Upsert music/soundtrack data if provided (non-critical — wrapped in try/catch)
    try {
      if (music !== undefined) {
        const hasAnyMusicData =
          music?.composer || music?.spotify_embed_url || music?.youtube_video_url;

        if (hasAnyMusicData) {
          const { error: musicError } = await (
            supabase.from("game_music") as ReturnType<typeof supabase.from>
          ).upsert(
            {
              game_id: gameId,
              composer: music.composer ?? null,
              spotify_embed_url: music.spotify_embed_url ?? null,
              youtube_video_url: music.youtube_video_url ?? null,
              updated_at: new Date().toISOString(),
            } as Record<string, unknown>,
            { onConflict: "game_id" }
          );

          if (musicError) {
            logger.warn("Error updating music", { error: musicError });
          }
        } else {
          // All fields empty — remove the row
          const { error: deleteError } = await (
            supabase.from("game_music") as ReturnType<typeof supabase.from>
          )
            .delete()
            .eq("game_id", gameId);

          if (deleteError) {
            logger.warn("Error deleting music row", { error: deleteError });
          }
        }
      }
    } catch (musicErr) {
      // game_music table may not exist yet — never block the main save
      logger.warn("Music operation failed (non-critical)", { error: musicErr });
    }

    // --- Field tracking: detect manual changes and record overrides ---
    try {
      const currentGameData = {
        cover_image_url: existingGame.cover_image_url,
        background_image_url: existingGame.background_image_url,
        release_date: existingGame.release_date,
        metascore: existingGame.metascore,
        playtime_hastily: existingGame.playtime_hastily,
        playtime_normally: existingGame.playtime_normally,
        playtime_completely: existingGame.playtime_completely,
        translations: existingGame.game_translations ?? [],
        genres: existingGame.game_genres ?? [],
        companies: existingGame.game_companies ?? [],
        screenshots: existingGame.game_screenshots ?? [],
        artwork: existingGame.game_artwork ?? [],
        age_ratings:
          (
            existingGame.game_ratings as
              | Array<{
                  rating_id: string;
                  is_primary: boolean;
                  game_rating_descriptors: Array<{ content_descriptor_id: string }>;
                }>
              | undefined
          )?.map((r) => ({
            rating_id: r.rating_id,
            is_primary: r.is_primary ?? false,
            content_descriptors: (r.game_rating_descriptors ?? []).map(
              (d) => d.content_descriptor_id
            ),
          })) ?? [],
        versions: existingGame.game_versions ?? [],
        languages: existingGame.game_languages ?? [],
        game_platforms: existingGame.game_platforms ?? [],
      };

      // Build AdminGameFormData-compatible object from validated PUT data.
      // Cast needed because DB types are wider (e.g. role: string vs "developer"|"publisher").
      const submittedFormData = {
        slug: game?.slug ?? "",
        cover_image_url: game?.cover_image_url ?? "",
        background_image_url: game?.background_image_url ?? "",
        release_date: game?.release_date ?? "",
        metascore: game?.metascore ?? null,
        playtime_hastily: game?.playtime_hastily ?? null,
        playtime_normally: game?.playtime_normally ?? null,
        playtime_completely: game?.playtime_completely ?? null,
        translations: (translations ?? currentGameData.translations).map((t) => ({
          language_code: t.language_code ?? "",
          title: t.title ?? undefined,
          description: t.description ?? undefined,
        })),
        genres: genres ?? currentGameData.genres,
        companies: companies ?? currentGameData.companies,
        screenshots: screenshots ?? currentGameData.screenshots,
        artwork: artwork ?? currentGameData.artwork,
        age_ratings: age_ratings ?? currentGameData.age_ratings,
        versions: versions ?? currentGameData.versions,
        languages: languages ?? currentGameData.languages,
        game_platforms: game_platforms ?? currentGameData.game_platforms,
        prices: prices ?? [],
      } as AdminGameFormData;

      const changedFields = detectChangedFields(
        currentGameData as CurrentGameData,
        submittedFormData
      );

      if (changedFields.length > 0) {
        const user = await getCurrentUser();
        await upsertFieldOverrides(
          supabase as unknown as SupabaseClientLike,
          gameId,
          changedFields,
          user.id
        );
      }
    } catch (trackingError) {
      // Field tracking is non-critical — log but don't fail the update
      logger.warn("Field tracking error (non-critical)", { error: trackingError });
    }

    // Send real-time notification for successful update
    await notifyGameUpdated(gameId);
    await invalidateGameCache(gameId);

    return NextResponse.json({
      message: "Game updated successfully",
      gameId,
    });
  } catch (error) {
    logger.error("Error in admin game PUT", { error });

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

    logger.warn("Deleting game with related data", {
      slug: existingGame.slug,
      gameId,
      relatedDataCounts,
    });

    // Perform the deletion (CASCADE will handle all related data)
    const { error: deleteError } = await supabase.from("games").delete().eq("id", gameId);

    if (deleteError) {
      logger.error("Error deleting game", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
    }

    // Verify complete deletion using the consistency check function
    const consistencyCheck = await verifyGameDeletionConsistency([gameId], supabase);

    if (!consistencyCheck.isConsistent) {
      logger.warn("Deletion consistency issues detected", {
        gameId,
        inconsistencies: consistencyCheck.inconsistencies,
      });
    }

    // Send real-time notification for successful deletion
    await notifyGameDeleted(gameId, existingGame.slug);
    await invalidateGameCache(gameId);

    // Purge deleted game from recommendation cache
    invalidateForDeletedGame(gameId);

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
    logger.error("Error in admin game DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
