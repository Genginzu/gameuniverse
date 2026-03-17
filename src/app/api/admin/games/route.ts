import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  createGameSchema,
  bulkGameOperationSchema,
  adminGameQuerySchema,
} from "@/lib/validations/game";
import {
  notifyGameCreated,
  notifyBulkOperation,
  invalidateGameCache,
  verifyGameDeletionConsistency,
} from "@/lib/realtime-updates";
import { logger } from "@/lib/logger";

// Types for Supabase query results
interface AdminGameRow {
  id: string;
  slug: string;
  cover_image_url?: string;
  background_image_url?: string;
  background_color?: string;
  release_date?: string;
  metascore?: number;
  system_requirements?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  game_translations?: Array<{
    id: string;
    title: string;
    description?: string;
    language_code: string;
  }>;
  game_genres?: Array<{
    genres?: {
      id: string;
      slug: string;
      genre_translations?: Array<{ name: string }>;
    };
  }>;
  game_companies?: Array<{
    id: string;
    role: string;
    is_primary: boolean;
    companies?: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  game_screenshots?: Array<{ count: number }>;
  game_artwork?: Array<{ count: number }>;
  game_videos?: Array<{ count: number }>;
  game_prices?: Array<{ count: number }>;
}

/**
 * GET /api/admin/games - List games with admin-specific data
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    // Validate query parameters — filter out null values so Zod defaults apply
    const rawParams: Record<string, string | undefined> = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
      company: searchParams.get("company") ?? undefined,
      sort_by: searchParams.get("sort_by") ?? undefined,
      sort_order: searchParams.get("sort_order") ?? undefined,
      locale: searchParams.get("locale") ?? undefined,
    };

    const queryResult = adminGameQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, genre, company, sort_by, sort_order, locale } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // When searching, first find matching game IDs via game_translations,
    // then fetch those games with ALL translations intact.
    // This avoids PostgREST filtering joined translation rows by the search term,
    // which would drop non-matching locale translations and cause "Untitled".
    let matchingGameIds: string[] | null = null;

    if (search?.trim()) {
      const { data: matchingTranslations, error: searchError } = await supabase
        .from("game_translations")
        .select("game_id")
        .ilike("title", `%${search.trim()}%`);

      if (searchError) {
        logger.error("Error searching game translations", { error: searchError });
        return NextResponse.json({ error: "Failed to search games" }, { status: 500 });
      }

      matchingGameIds = [
        ...new Set(
          matchingTranslations?.map((t) => t.game_id).filter((id): id is string => id !== null) ??
            []
        ),
      ];

      if (matchingGameIds.length === 0) {
        return NextResponse.json({
          games: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }
    }

    // Build the base query with admin-specific fields
    let query = supabase.from("games").select(
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
        game_translations(
          id,
          title,
          description,
          language_code
        ),
        game_genres(
          genres(
            id,
            slug,
            genre_translations(
              name
            )
          )
        ),
        game_companies(
          id,
          role,
          is_primary,
          companies(
            id,
            name,
            slug
          )
        ),
        game_screenshots(count),
        game_artwork(count),
        game_videos(count),
        game_prices(count)
      `
    );

    // Filter by matching game IDs from the search step
    if (matchingGameIds) {
      query = query.in("id", matchingGameIds);
    }

    // Get total count for pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery: any = supabase.from("games").select("id", { count: "exact", head: true });

    if (matchingGameIds) {
      countQuery = countQuery.in("id", matchingGameIds);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting games", { error: countError });
      return NextResponse.json({ error: "Failed to count games" }, { status: 500 });
    }

    // Apply sorting and pagination
    // Note: sorting by joined table columns (game_translations.title) only orders
    // the nested rows, not the parent. Use created_at as fallback for title sort.
    const orderColumn = sort_by === "title" ? "created_at" : sort_by;
    const { data: games, error } = await query
      .order(orderColumn, {
        ascending: sort_order === "asc",
      })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching admin games", { error });
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }

    // Transform data for admin view
    const transformedGames =
      (games as AdminGameRow[] | null)?.map((game) => {
        // Prefer translation matching the requested locale, fallback to first available
        const translations = game.game_translations ?? [];
        const translation =
          translations.find((t) => t.language_code === locale) || translations[0] || null;
        const genres =
          game.game_genres?.map((gg) => ({
            id: gg.genres?.id,
            slug: gg.genres?.slug,
            name: gg.genres?.genre_translations?.[0]?.name || "Unknown",
          })) || [];

        const companies = {
          developers: game.game_companies?.filter((gc) => gc.role === "developer") || [],
          publishers: game.game_companies?.filter((gc) => gc.role === "publisher") || [],
        };

        return {
          id: game.id,
          slug: game.slug,
          title: translation?.title || "Untitled",
          description: translation?.description,
          coverImage: game.cover_image_url,
          backgroundImage: game.background_image_url,
          backgroundColor: game.background_color,
          releaseDate: game.release_date,
          metascore: game.metascore,
          systemRequirements: game.system_requirements,
          genres,
          companies,
          mediaCount: {
            screenshots: game.game_screenshots?.[0]?.count || 0,
            artwork: game.game_artwork?.[0]?.count || 0,
            videos: game.game_videos?.[0]?.count || 0,
            prices: game.game_prices?.[0]?.count || 0,
          },
          createdAt: game.created_at,
          updatedAt: game.updated_at,
        };
      }) || [];

    // Post-sort by title if requested (can't reliably sort by joined column in Supabase)
    if (sort_by === "title") {
      transformedGames.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title);
        return sort_order === "asc" ? cmp : -cmp;
      });
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      games: transformedGames,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        genre,
        company,
        sort_by,
        sort_order,
        locale,
      },
    });
  } catch (error) {
    logger.error("Error in admin games GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/games - Create a new game
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const body = await request.json();

    // Validate input data
    const validationResult = createGameSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { game, translations, companies, genres, screenshots, artwork, videos, prices, music } =
      validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Start transaction by creating the game first
    const { data: createdGame, error: gameError } = await supabase
      .from("games")
      .insert([game])
      .select("id, slug")
      .single();

    if (gameError) {
      logger.error("Error creating game", { error: gameError });

      if (gameError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "Game with this slug already exists" }, { status: 409 });
      }

      return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }

    const gameId = createdGame.id;

    try {
      // Insert translations
      const translationsWithGameId = translations.map((t) => ({ ...t, game_id: gameId }));
      const { error: translationsError } = await supabase
        .from("game_translations")
        .insert(translationsWithGameId);

      if (translationsError) {
        throw new Error(`Failed to create translations: ${translationsError.message}`);
      }

      // Insert company relations
      const companiesWithGameId = companies.map((c) => ({ ...c, game_id: gameId }));
      const { error: companiesError } = await supabase
        .from("game_companies")
        .insert(companiesWithGameId);

      if (companiesError) {
        throw new Error(`Failed to create company relations: ${companiesError.message}`);
      }

      // Insert genre relations
      const genresWithGameId = genres.map((g) => ({ ...g, game_id: gameId }));
      const { error: genresError } = await supabase.from("game_genres").insert(genresWithGameId);

      if (genresError) {
        throw new Error(`Failed to create genre relations: ${genresError.message}`);
      }

      // Insert optional media and pricing data
      if (screenshots && screenshots.length > 0) {
        const screenshotsWithGameId = screenshots.map((s) => ({ ...s, game_id: gameId }));
        const { error: screenshotsError } = await supabase
          .from("game_screenshots")
          .insert(screenshotsWithGameId);

        if (screenshotsError) {
          logger.warn("Failed to create screenshots", { error: screenshotsError });
        }
      }

      if (artwork && artwork.length > 0) {
        const artworkWithGameId = artwork.map((a) => ({ ...a, game_id: gameId }));
        const { error: artworkError } = await supabase
          .from("game_artwork")
          .insert(artworkWithGameId);

        if (artworkError) {
          logger.warn("Failed to create artwork", { error: artworkError });
        }
      }

      if (videos && videos.length > 0) {
        const videosWithGameId = videos.map((v) => ({ ...v, game_id: gameId }));
        const { error: videosError } = await supabase.from("game_videos").insert(videosWithGameId);

        if (videosError) {
          logger.warn("Failed to create videos", { error: videosError });
        }
      }

      if (prices && prices.length > 0) {
        const pricesWithGameId = prices.map((p) => ({ ...p, game_id: gameId }));
        const { error: pricesError } = await supabase.from("game_prices").insert(pricesWithGameId);

        if (pricesError) {
          logger.warn("Failed to create prices", { error: pricesError });
        }
      }

      // Insert music/soundtrack data if provided (non-critical)
      try {
        if (music && (music.composer || music.spotify_embed_url || music.youtube_video_url)) {
          const { error: musicError } = await (
            supabase.from("game_music") as ReturnType<typeof supabase.from>
          ).insert({
            game_id: gameId,
            composer: music.composer ?? null,
            spotify_embed_url: music.spotify_embed_url ?? null,
            youtube_video_url: music.youtube_video_url ?? null,
          } as Record<string, unknown>);

          if (musicError) {
            logger.warn("Failed to create music data", { error: musicError });
          }
        }
      } catch (musicErr) {
        logger.warn("Music insert failed (non-critical)", { error: musicErr });
      }

      return NextResponse.json(
        {
          message: "Game created successfully",
          game: {
            id: gameId,
            slug: createdGame.slug,
          },
        },
        { status: 201 }
      );
    } catch (relatedDataError) {
      // If any related data insertion fails, clean up the game
      logger.error("Error creating related data", { error: relatedDataError });

      await supabase.from("games").delete().eq("id", gameId);

      return NextResponse.json(
        { error: "Failed to create game with related data", details: relatedDataError },
        { status: 500 }
      );
    } finally {
      // Send real-time notification for successful creation
      if (createdGame) {
        await notifyGameCreated(gameId, createdGame.slug);
        await invalidateGameCache(gameId);
      }
    }
  } catch (error) {
    logger.error("Error in admin games POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/games - Bulk operations on games
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const body = await request.json();

    // Validate input data
    const validationResult = bulkGameOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { operation, game_ids, data } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    if (operation === "delete") {
      // Bulk delete games with complete cleanup verification

      // First, get information about games to be deleted for audit
      const { data: gamesToDelete, error: fetchError } = await supabase
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
        .in("id", game_ids);

      if (fetchError) {
        logger.error("Error fetching games for deletion", { error: fetchError });
        return NextResponse.json({ error: "Failed to fetch games for deletion" }, { status: 500 });
      }

      if (!gamesToDelete || gamesToDelete.length === 0) {
        return NextResponse.json({ error: "No games found for deletion" }, { status: 404 });
      }

      // Log what will be deleted for audit purposes
      const deletionSummary = gamesToDelete.map((game) => ({
        id: game.id,
        slug: game.slug,
        relatedDataCounts: {
          translations: game.game_translations?.[0]?.count || 0,
          genres: game.game_genres?.[0]?.count || 0,
          companies: game.game_companies?.[0]?.count || 0,
          screenshots: game.game_screenshots?.[0]?.count || 0,
          artwork: game.game_artwork?.[0]?.count || 0,
          videos: game.game_videos?.[0]?.count || 0,
          prices: game.game_prices?.[0]?.count || 0,
        },
      }));

      logger.warn("Bulk deleting games", { count: gamesToDelete.length, deletionSummary });

      // Perform bulk deletion (CASCADE will handle all related data)
      const { error } = await supabase.from("games").delete().in("id", game_ids);

      if (error) {
        logger.error("Error bulk deleting games", { error });
        return NextResponse.json({ error: "Failed to delete games" }, { status: 500 });
      }

      // Verify complete deletion using the consistency check function
      const consistencyCheck = await verifyGameDeletionConsistency(game_ids, supabase);

      if (!consistencyCheck.isConsistent) {
        logger.warn("Deletion consistency issues detected", {
          inconsistencies: consistencyCheck.inconsistencies,
        });
      }

      // Send real-time notification for bulk delete
      await notifyBulkOperation("delete", game_ids);
      await invalidateGameCache(game_ids);

      return NextResponse.json({
        message: `Successfully deleted ${game_ids.length} games with complete cleanup`,
        deletedIds: game_ids,
        deletionSummary,
        consistencyCheck,
        timestamp: new Date().toISOString(),
      });
    } else if (operation === "update" && data) {
      // Bulk update games
      const { error } = await supabase.from("games").update(data).in("id", game_ids);

      if (error) {
        logger.error("Error bulk updating games", { error });
        return NextResponse.json({ error: "Failed to update games" }, { status: 500 });
      }

      // Send real-time notification for bulk update
      await notifyBulkOperation("update", game_ids, data);
      await invalidateGameCache(game_ids);

      return NextResponse.json({
        message: `Successfully updated ${game_ids.length} games`,
        updatedIds: game_ids,
      });
    }

    return NextResponse.json({ error: "Invalid operation or missing data" }, { status: 400 });
  } catch (error) {
    logger.error("Error in admin games PATCH", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
