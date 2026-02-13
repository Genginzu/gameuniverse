import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { companyQuerySchema, adminCompanyFormSchema } from "@/lib/validations/admin-company-form";

/**
 * GET /api/admin/companies - List companies with pagination, search, sort, and game count
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
    };

    const queryResult = companyQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    const applySearchFilter = (query: ReturnType<typeof supabase.from>) => {
      if (!search?.trim()) return query;
      const term = `%${search.trim()}%`;
      return query.or(`name.ilike.${term},slug.ilike.${term}`);
    };

    // Count query
    const { count: totalCount, error: countError } = await applySearchFilter(
      supabase.from("companies").select("id", { count: "exact", head: true })
    );

    if (countError) {
      console.error("Error counting companies:", countError);
      return NextResponse.json({ error: "Failed to count companies" }, { status: 500 });
    }

    // Data query — include translations
    let dataQuery = applySearchFilter(
      supabase.from("companies").select(
        `id, name, slug, website_url, logo_url, founded_year, headquarters,
           company_type, is_active,
           company_translations(company_id, language_code, description)`
      )
    );

    dataQuery = dataQuery.order(sort_by, { ascending: sort_order === "asc" });
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    const { data: companiesRaw, error: dataError } = await dataQuery;

    if (dataError) {
      console.error("Error fetching companies:", dataError);
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    type TranslationRow = { company_id: string; language_code: string; description: string | null };
    type CompanyRow = {
      id: string;
      name: string;
      slug: string;
      website_url: string | null;
      logo_url: string | null;
      founded_year: number | null;
      headquarters: string | null;
      company_type: string;
      is_active: boolean;
      company_translations: TranslationRow[] | null;
    };

    const typedCompanies = (companiesRaw || []) as CompanyRow[];

    // Get game counts for all companies
    const companyIds = typedCompanies.map((c) => c.id);
    let gameCounts: Record<string, number> = {};

    if (companyIds.length > 0) {
      const { data: gameCompanies } = await supabase
        .from("game_companies")
        .select("company_id")
        .in("company_id", companyIds);

      gameCounts = (gameCompanies || []).reduce(
        (acc, gc) => {
          acc[gc.company_id] = (acc[gc.company_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    const companies = typedCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      website_url: c.website_url,
      logo_url: c.logo_url,
      founded_year: c.founded_year,
      headquarters: c.headquarters,
      company_type: c.company_type,
      is_active: c.is_active,
      gameCount: gameCounts[c.id] || 0,
      translations: (c.company_translations || []).map((t) => ({
        language_code: t.language_code,
        description: t.description || "",
      })),
    }));

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      companies,
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
    console.error("Error in admin companies GET:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/companies - Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const validationResult = adminCompanyFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      company_type,
      website_url,
      logo_url,
      founded_year,
      headquarters,
      translations,
    } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    const { data: company, error: insertError } = await supabase
      .from("companies")
      .insert({
        name,
        slug,
        company_type,
        website_url: website_url || null,
        logo_url: logo_url || null,
        founded_year: typeof founded_year === "number" ? founded_year : null,
        headquarters: headquarters || null,
      })
      .select(
        "id, name, slug, website_url, logo_url, founded_year, headquarters, company_type, is_active"
      )
      .single();

    if (insertError) {
      console.error("Error creating company:", insertError);

      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "A company with this name or slug already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }

    // Upsert translations if provided
    const savedTranslations = await upsertCompanyTranslations(supabase, company.id, translations);

    return NextResponse.json(
      {
        company: {
          ...company,
          gameCount: 0,
          translations: savedTranslations,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in admin companies POST:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Upsert company translations and return the normalized array */
async function upsertCompanyTranslations(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  companyId: string,
  translations?: Array<{ language_code: string; description?: string }>
) {
  if (!translations || translations.length === 0) return [];

  const rows = translations.map((t) => ({
    company_id: companyId,
    language_code: t.language_code,
    description: t.description || null,
  }));

  // company_translations not in generated Supabase types — cast to bypass
  const { error } = await (supabase as any)
    .from("company_translations")
    .upsert(rows, { onConflict: "company_id,language_code" });

  if (error) {
    console.error("Error upserting company translations:", error);
  }

  return translations.map((t) => ({
    language_code: t.language_code,
    description: t.description || "",
  }));
}
