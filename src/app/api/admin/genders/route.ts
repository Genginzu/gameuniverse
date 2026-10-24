import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute } from "@/lib/api/route";
import { genderQuerySchema, adminGenderFormSchema } from "@/lib/validations/admin-gender-form";
import { logger } from "@/lib/logger";
import { ilikeAnyFilter } from "@/lib/utils/postgrestFilter";

/**
 * GET /api/admin/genders - List genders with pagination, search, sort, and character count
 */
export const GET = defineRoute({ auth: "admin", query: genderQuerySchema }, async ({ query }) => {
  const { page, limit, search, sort_by, sort_order, locale } = query;

  const supabase = await createRouteHandlerClient();
  const offset = (page - 1) * limit;

  // genders/gender_translations/characters tables not in generated Supabase types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // When searching, find gender IDs matching translated name for the locale
  let searchGenderIds: string[] | null = null;
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    const { data: matchingTranslations } = await db
      .from("gender_translations")
      .select("gender_id")
      .eq("language_code", locale)
      .ilike("name", term);

    searchGenderIds = (matchingTranslations || [])
      .map((t: { gender_id: string }) => t.gender_id)
      .filter(Boolean) as string[];
  }

  // Build search filter helper
  const applySearchFilter = (dbQuery: ReturnType<typeof db.from>) => {
    if (!search?.trim()) return dbQuery;
    const term = `%${search.trim()}%`;
    if (searchGenderIds && searchGenderIds.length > 0) {
      return dbQuery.or(`${ilikeAnyFilter(["slug"], search)},id.in.(${searchGenderIds.join(",")})`);
    }
    return dbQuery.ilike("slug", term);
  };

  // Count query
  const countQuery = applySearchFilter(
    db.from("genders").select("id", { count: "exact", head: true })
  );
  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    logger.error("Error counting genders", { error: countError });
    return NextResponse.json({ error: "Failed to count genders" }, { status: 500 });
  }

  // Data query - fetch genders with translations
  let dataQuery = applySearchFilter(
    db.from("genders").select("id, slug, gender_translations(gender_id, language_code, name)")
  );

  if (sort_by === "slug") {
    dataQuery = dataQuery.order("slug", { ascending: sort_order === "asc" });
    dataQuery = dataQuery.range(offset, offset + limit - 1);
  }

  const { data: gendersRaw, error: dataError } = await dataQuery;

  if (dataError) {
    logger.error("Error fetching genders", { error: dataError });
    return NextResponse.json({ error: "Failed to fetch genders" }, { status: 500 });
  }

  type GenderRow = {
    id: string;
    slug: string;
    gender_translations: { gender_id: string; language_code: string; name: string }[];
  };

  const typedGenders = (gendersRaw || []) as GenderRow[];

  // Get character counts for all genders
  const genderIds = typedGenders.map((g) => g.id);
  let characterCounts: Record<string, number> = {};

  if (genderIds.length > 0) {
    const { data: characters } = await db
      .from("characters")
      .select("gender_id")
      .in("gender_id", genderIds);

    characterCounts = (characters || []).reduce(
      (acc: Record<string, number>, c: { gender_id: string | null }) => {
        if (c.gender_id) acc[c.gender_id] = (acc[c.gender_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  // Map to response format
  let genders = typedGenders.map((g) => ({
    id: g.id,
    slug: g.slug,
    characterCount: characterCounts[g.id] || 0,
    translations: (g.gender_translations || []).map((t) => ({
      language_code: t.language_code,
      name: t.name,
    })),
  }));

  // Sort by translated name if requested (post-processing)
  if (sort_by === "name") {
    genders.sort((a, b) => {
      const nameA = a.translations.find((t) => t.language_code === locale)?.name || a.slug;
      const nameB = b.translations.find((t) => t.language_code === locale)?.name || b.slug;
      const comparison = nameA.localeCompare(nameB);
      return sort_order === "asc" ? comparison : -comparison;
    });
    genders = genders.slice(offset, offset + limit);
  }

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return NextResponse.json({
    genders,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: totalCount || 0,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
});

/**
 * POST /api/admin/genders - Create a new gender with translations
 */
export const POST = defineRoute({ auth: "admin", body: adminGenderFormSchema }, async ({ body }) => {
  const { slug, translations } = body;

  const supabase = await createRouteHandlerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Insert the gender
  const { data: gender, error: genderError } = await db
    .from("genders")
    .insert({ slug })
    .select("id, slug")
    .single();

  if (genderError) {
    if (genderError.code === "23505") throw conflict("A gender with this slug already exists");
    logger.error("Error creating gender", { error: genderError });
    return NextResponse.json({ error: "Failed to create gender" }, { status: 500 });
  }

  // Insert translations
  const translationRows = translations.map((t) => ({
    gender_id: gender.id,
    language_code: t.language_code,
    name: t.name,
  }));

  const { error: translationError } = await db.from("gender_translations").insert(translationRows);

  if (translationError) {
    logger.error("Error creating gender translations", { error: translationError });
    await db.from("genders").delete().eq("id", gender.id);
    return NextResponse.json({ error: "Failed to create gender translations" }, { status: 500 });
  }

  return NextResponse.json(
    {
      gender: {
        id: gender.id,
        slug: gender.slug,
        characterCount: 0,
        translations: translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
        })),
      },
    },
    { status: 201 }
  );
});
