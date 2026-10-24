import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute } from "@/lib/api/route";
import { companyQuerySchema, adminCompanyFormSchema } from "@/lib/validations/admin-company-form";
import { logger } from "@/lib/logger";
import { ilikeAnyFilter } from "@/lib/utils/postgrestFilter";

/**
 * GET /api/admin/companies - List companies with pagination, search, sort, and game count
 */
export const GET = defineRoute({ auth: "admin", query: companyQuerySchema }, async ({ query }) => {
  const { page, limit, search, sort_by, sort_order } = query;

  const supabase = await createRouteHandlerClient();
  const offset = (page - 1) * limit;

  const applySearchFilter = (dbQuery: ReturnType<typeof supabase.from>) => {
    if (!search?.trim()) return dbQuery;
    return dbQuery.or(ilikeAnyFilter(["name", "slug"], search));
  };

  // Count query
  const { count: totalCount, error: countError } = await applySearchFilter(
    supabase.from("companies").select("id", { count: "exact", head: true })
  );

  if (countError) {
    logger.error("Error counting companies", { error: countError });
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
    logger.error("Error fetching companies", { error: dataError });
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
});

/**
 * POST /api/admin/companies - Create a new company
 */
export const POST = defineRoute(
  { auth: "admin", body: adminCompanyFormSchema },
  async ({ body }) => {
    const {
      name,
      slug,
      company_type,
      website_url,
      logo_url,
      founded_year,
      headquarters,
      translations,
    } = body;

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
      if (insertError.code === "23505") {
        throw conflict("A company with this name or slug already exists");
      }
      logger.error("Error creating company", { error: insertError });
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
  }
);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("company_translations")
    .upsert(rows, { onConflict: "company_id,language_code" });

  if (error) {
    logger.error("Error upserting company translations", { error });
  }

  return translations.map((t) => ({
    language_code: t.language_code,
    description: t.description || "",
  }));
}
