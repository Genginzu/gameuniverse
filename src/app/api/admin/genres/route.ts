import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { genreQuerySchema, adminGenreFormSchema } from "@/lib/validations/admin-genre-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/genres - List genres with pagination, search, sort, and game count
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

    const queryResult = genreQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order, locale } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // When searching, find genre IDs matching translated name for the locale
    let searchGenreIds: string[] | null = null;
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      const { data: matchingTranslations } = await supabase
        .from("genre_translations")
        .select("genre_id")
        .eq("language_code", locale)
        .ilike("name", term);

      searchGenreIds = (matchingTranslations || [])
        .map((t) => t.genre_id)
        .filter(Boolean) as string[];
    }

    // Build search filter helper
    const applySearchFilter = (query: ReturnType<typeof supabase.from>) => {
      if (!search?.trim()) return query;
      const term = `%${search.trim()}%`;
      if (searchGenreIds && searchGenreIds.length > 0) {
        return query.or(`slug.ilike.${term},id.in.(${searchGenreIds.join(",")})`);
      }
      return query.ilike("slug", term);
    };

    // Count query
    const countQuery = applySearchFilter(
      supabase.from("genres").select("id", { count: "exact", head: true })
    );
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting genres", { error: countError });
      return NextResponse.json({ error: "Failed to count genres" }, { status: 500 });
    }

    // Data query - fetch genres with translations
    let dataQuery = applySearchFilter(
      supabase
        .from("genres")
        .select("id, slug, genre_translations(genre_id, language_code, name, description)")
    );

    // Sort: by slug directly, or by translated name via post-processing
    if (sort_by === "slug") {
      dataQuery = dataQuery.order("slug", { ascending: sort_order === "asc" });
    }

    // For name sort, we fetch all matching then sort in JS (Supabase can't sort by nested join)
    // For slug sort, we can use range directly
    if (sort_by === "slug") {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }

    const { data: genresRaw, error: dataError } = await dataQuery;

    if (dataError) {
      logger.error("Error fetching genres", { error: dataError });
      return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 });
    }

    // Type for raw genre rows from Supabase (lost due to applySearchFilter)
    type GenreRow = {
      id: string;
      slug: string;
      genre_translations: {
        genre_id: string;
        language_code: string;
        name: string;
        description: string;
      }[];
    };

    const typedGenres = (genresRaw || []) as GenreRow[];

    // Get game counts for all genres
    const genreIds = typedGenres.map((g) => g.id);
    let gameCounts: Record<string, number> = {};

    if (genreIds.length > 0) {
      const { data: gameGenres } = await supabase
        .from("game_genres")
        .select("genre_id")
        .in("genre_id", genreIds);

      gameCounts = (gameGenres || []).reduce(
        (acc, gg) => {
          acc[gg.genre_id] = (acc[gg.genre_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Map to AdminGenre format
    let genres = typedGenres.map((g) => ({
      id: g.id,
      slug: g.slug,
      gameCount: gameCounts[g.id] || 0,
      translations: (g.genre_translations || []).map((t) => ({
        language_code: t.language_code,
        name: t.name,
        description: t.description || "",
      })),
    }));

    // Sort by translated name if requested (post-processing)
    if (sort_by === "name") {
      genres.sort((a, b) => {
        const nameA = a.translations.find((t) => t.language_code === locale)?.name || a.slug;
        const nameB = b.translations.find((t) => t.language_code === locale)?.name || b.slug;
        const comparison = nameA.localeCompare(nameB);
        return sort_order === "asc" ? comparison : -comparison;
      });
      // Apply pagination manually for name sort
      genres = genres.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      genres,
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
    logger.error("Error in admin genres GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/genres - Create a new genre with translations
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const validationResult = adminGenreFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { slug, translations } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Insert the genre
    const { data: genre, error: genreError } = await supabase
      .from("genres")
      .insert({ slug })
      .select("id, slug")
      .single();

    if (genreError) {
      logger.error("Error creating genre", { error: genreError });

      if (genreError.code === "23505") {
        return NextResponse.json(
          { error: "A genre with this slug already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to create genre" }, { status: 500 });
    }

    // Insert translations
    const translationRows = translations.map((t) => ({
      genre_id: genre.id,
      language_code: t.language_code,
      name: t.name,
      description: t.description || null,
    }));

    const { error: translationError } = await supabase
      .from("genre_translations")
      .insert(translationRows);

    if (translationError) {
      logger.error("Error creating genre translations", { error: translationError });
      // Clean up the genre if translations fail
      await supabase.from("genres").delete().eq("id", genre.id);
      return NextResponse.json({ error: "Failed to create genre translations" }, { status: 500 });
    }

    return NextResponse.json(
      {
        genre: {
          id: genre.id,
          slug: genre.slug,
          gameCount: 0,
          translations: translations.map((t) => ({
            language_code: t.language_code,
            name: t.name,
            description: t.description || "",
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin genres POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
