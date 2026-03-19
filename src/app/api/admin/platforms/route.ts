import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  platformQuerySchema,
  adminPlatformFormSchema,
} from "@/lib/validations/admin-platform-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/platforms - List platforms with pagination, search, sort, and game count
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

    const queryResult = platformQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order, locale } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // When searching, find platform IDs matching translated name for the locale
    let searchPlatformIds: string[] | null = null;
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      const { data: matchingTranslations } = await supabase
        .from("platform_translations")
        .select("platform_id")
        .eq("language_code", locale)
        .ilike("name", term);

      searchPlatformIds = (matchingTranslations || [])
        .map((t) => t.platform_id)
        .filter(Boolean) as string[];
    }

    // Build search filter helper
    const applySearchFilter = (query: ReturnType<typeof supabase.from>) => {
      if (!search?.trim()) return query;
      const term = `%${search.trim()}%`;
      if (searchPlatformIds && searchPlatformIds.length > 0) {
        return query.or(`slug.ilike.${term},id.in.(${searchPlatformIds.join(",")})`);
      }
      return query.ilike("slug", term);
    };

    // Count query
    const countQuery = applySearchFilter(
      supabase.from("platforms").select("id", { count: "exact", head: true })
    );
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting platforms", { error: countError });
      return NextResponse.json({ error: "Failed to count platforms" }, { status: 500 });
    }

    // Data query - fetch platforms with translations
    let dataQuery = applySearchFilter(
      supabase
        .from("platforms")
        .select(
          "id, slug, icon_url, platform_translations(platform_id, language_code, name, abbreviation)"
        )
    );

    if (sort_by === "slug") {
      dataQuery = dataQuery.order("slug", { ascending: sort_order === "asc" });
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }

    const { data: platformsRaw, error: dataError } = await dataQuery;

    if (dataError) {
      logger.error("Error fetching platforms", { error: dataError });
      return NextResponse.json({ error: "Failed to fetch platforms" }, { status: 500 });
    }

    type PlatformRow = {
      id: string;
      slug: string;
      icon_url: string | null;
      platform_translations: {
        platform_id: string;
        language_code: string;
        name: string;
        abbreviation: string | null;
      }[];
    };

    const typedPlatforms = (platformsRaw || []) as PlatformRow[];

    // Get game counts for all platforms
    const platformIds = typedPlatforms.map((p) => p.id);
    let gameCounts: Record<string, number> = {};

    if (platformIds.length > 0) {
      const { data: gamePlatforms } = await supabase
        .from("game_platforms")
        .select("platform_id")
        .in("platform_id", platformIds);

      gameCounts = (gamePlatforms || []).reduce(
        (acc, gp) => {
          acc[gp.platform_id] = (acc[gp.platform_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Map to AdminPlatform format
    let platforms = typedPlatforms.map((p) => ({
      id: p.id,
      slug: p.slug,
      iconUrl: p.icon_url || undefined,
      gameCount: gameCounts[p.id] || 0,
      translations: (p.platform_translations || []).map((t) => ({
        language_code: t.language_code,
        name: t.name,
        abbreviation: t.abbreviation || undefined,
      })),
    }));

    // Sort by translated name or game_count if requested (post-processing)
    if (sort_by === "name" || sort_by === "game_count") {
      platforms.sort((a, b) => {
        if (sort_by === "game_count") {
          const diff = a.gameCount - b.gameCount;
          return sort_order === "asc" ? diff : -diff;
        }
        const nameA = a.translations.find((t) => t.language_code === locale)?.name || a.slug;
        const nameB = b.translations.find((t) => t.language_code === locale)?.name || b.slug;
        const comparison = nameA.localeCompare(nameB);
        return sort_order === "asc" ? comparison : -comparison;
      });
      platforms = platforms.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      platforms,
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
    logger.error("Error in admin platforms GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/platforms - Create a new platform with translations
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const validationResult = adminPlatformFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { slug, iconUrl, translations } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Insert the platform
    const { data: platform, error: platformError } = await supabase
      .from("platforms")
      .insert({ slug, icon_url: iconUrl || null })
      .select("id, slug, icon_url")
      .single();

    if (platformError) {
      logger.error("Error creating platform", { error: platformError });

      if (platformError.code === "23505") {
        return NextResponse.json(
          { error: "A platform with this slug already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to create platform" }, { status: 500 });
    }

    // Insert translations
    const translationRows = translations.map((t) => ({
      platform_id: platform.id,
      language_code: t.language_code,
      name: t.name,
      abbreviation: t.abbreviation || null,
    }));

    const { error: translationError } = await supabase
      .from("platform_translations")
      .insert(translationRows);

    if (translationError) {
      logger.error("Error creating platform translations", { error: translationError });
      // Clean up the platform if translations fail
      await supabase.from("platforms").delete().eq("id", platform.id);
      return NextResponse.json(
        { error: "Failed to create platform translations" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        platform: {
          id: platform.id,
          slug: platform.slug,
          iconUrl: platform.icon_url || undefined,
          gameCount: 0,
          translations: translations.map((t) => ({
            language_code: t.language_code,
            name: t.name,
            abbreviation: t.abbreviation || undefined,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin platforms POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
