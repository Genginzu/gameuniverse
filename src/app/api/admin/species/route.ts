import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { speciesQuerySchema, adminSpeciesFormSchema } from "@/lib/validations/admin-species-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/species - List species with pagination, search, sort, and character count
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

    const queryResult = speciesQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order, locale } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // species/species_translations/characters tables not in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // When searching, find species IDs matching translated name for the locale
    let searchSpeciesIds: string[] | null = null;
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      const { data: matchingTranslations } = await db
        .from("species_translations")
        .select("species_id")
        .eq("language_code", locale)
        .ilike("name", term);

      searchSpeciesIds = (matchingTranslations || [])
        .map((t: { species_id: string }) => t.species_id)
        .filter(Boolean) as string[];
    }

    // Build search filter helper
    const applySearchFilter = (query: ReturnType<typeof db.from>) => {
      if (!search?.trim()) return query;
      const term = `%${search.trim()}%`;
      if (searchSpeciesIds && searchSpeciesIds.length > 0) {
        return query.or(`slug.ilike.${term},id.in.(${searchSpeciesIds.join(",")})`);
      }
      return query.ilike("slug", term);
    };

    // Count query
    const countQuery = applySearchFilter(
      db.from("species").select("id", { count: "exact", head: true })
    );
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting species", { error: countError });
      return NextResponse.json({ error: "Failed to count species" }, { status: 500 });
    }

    // Data query - fetch species with translations
    let dataQuery = applySearchFilter(
      db.from("species").select("id, slug, species_translations(species_id, language_code, name)")
    );

    if (sort_by === "slug") {
      dataQuery = dataQuery.order("slug", { ascending: sort_order === "asc" });
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }

    const { data: speciesRaw, error: dataError } = await dataQuery;

    if (dataError) {
      logger.error("Error fetching species", { error: dataError });
      return NextResponse.json({ error: "Failed to fetch species" }, { status: 500 });
    }

    type SpeciesRow = {
      id: string;
      slug: string;
      species_translations: { species_id: string; language_code: string; name: string }[];
    };

    const typedSpecies = (speciesRaw || []) as SpeciesRow[];

    // Get character counts for all species
    const speciesIds = typedSpecies.map((s) => s.id);
    let characterCounts: Record<string, number> = {};

    if (speciesIds.length > 0) {
      const { data: characters } = await db
        .from("characters")
        .select("species_id")
        .in("species_id", speciesIds);

      characterCounts = (characters || []).reduce(
        (acc: Record<string, number>, c: { species_id: string | null }) => {
          if (c.species_id) acc[c.species_id] = (acc[c.species_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Map to response format
    let species = typedSpecies.map((s) => ({
      id: s.id,
      slug: s.slug,
      characterCount: characterCounts[s.id] || 0,
      translations: (s.species_translations || []).map((t) => ({
        language_code: t.language_code,
        name: t.name,
      })),
    }));

    // Sort by translated name if requested (post-processing)
    if (sort_by === "name") {
      species.sort((a, b) => {
        const nameA = a.translations.find((t) => t.language_code === locale)?.name || a.slug;
        const nameB = b.translations.find((t) => t.language_code === locale)?.name || b.slug;
        const comparison = nameA.localeCompare(nameB);
        return sort_order === "asc" ? comparison : -comparison;
      });
      species = species.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      species,
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
    logger.error("Error in admin species GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/species - Create a new species with translations
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const validationResult = adminSpeciesFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { slug, translations } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Insert the species
    const { data: species, error: speciesError } = await db
      .from("species")
      .insert({ slug })
      .select("id, slug")
      .single();

    if (speciesError) {
      logger.error("Error creating species", { error: speciesError });

      if (speciesError.code === "23505") {
        return NextResponse.json(
          { error: "A species with this slug already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to create species" }, { status: 500 });
    }

    // Insert translations
    const translationRows = translations.map((t) => ({
      species_id: species.id,
      language_code: t.language_code,
      name: t.name,
    }));

    const { error: translationError } = await db
      .from("species_translations")
      .insert(translationRows);

    if (translationError) {
      logger.error("Error creating species translations", { error: translationError });
      await db.from("species").delete().eq("id", species.id);
      return NextResponse.json({ error: "Failed to create species translations" }, { status: 500 });
    }

    return NextResponse.json(
      {
        species: {
          id: species.id,
          slug: species.slug,
          characterCount: 0,
          translations: translations.map((t) => ({
            language_code: t.language_code,
            name: t.name,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin species POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
