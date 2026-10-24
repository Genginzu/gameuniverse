import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound } from "@/lib/api/route";
import { adminCompanyFormSchema } from "@/lib/validations/admin-company-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/companies/[slug] - Get a single company with translations and game count
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { slug } = params;

  const supabase = await createRouteHandlerClient();

  // company_translations table may not be in generated types yet — use type assertion
  const { data: companyRaw, error } = await supabase
    .from("companies")
    .select(
      `id, name, slug, website_url, logo_url, founded_year, headquarters,
         company_type, is_active,
         company_translations(company_id, language_code, description)`
    )
    .eq("slug", slug)
    .single();

  type TranslationRow = { company_id: string; language_code: string; description: string | null };
  type CompanyWithTranslations = {
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

  const company = companyRaw as unknown as CompanyWithTranslations | null;

  if (error || !company) throw notFound("Company not found");

  const { count: gameCount, error: countError } = await supabase
    .from("game_companies")
    .select("game_id", { count: "exact", head: true })
    .eq("company_id", company.id);

  if (countError) {
    logger.error("Error counting company games", { error: countError });
  }

  const translations = (company.company_translations || []).map((t) => ({
    language_code: t.language_code,
    description: t.description || "",
  }));

  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      website_url: company.website_url,
      logo_url: company.logo_url,
      founded_year: company.founded_year,
      headquarters: company.headquarters,
      company_type: company.company_type,
      is_active: company.is_active,
      gameCount: gameCount || 0,
      translations,
    },
  });
});

// Validation schema for PUT body (slug is immutable, not in body)
const updateCompanySchema = adminCompanyFormSchema.omit({ slug: true });

/**
 * PUT /api/admin/companies/[slug] - Update a company with translations
 */
export const PUT = defineRoute(
  { auth: "admin", body: updateCompanySchema },
  async ({ params, body }) => {
    const { slug } = params;
    const { name, company_type, website_url, logo_url, founded_year, headquarters, translations } =
      body;

    const supabase = await createRouteHandlerClient();

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) throw notFound("Company not found");

    const { data: updated, error: updateError } = await supabase
      .from("companies")
      .update({
        name,
        company_type,
        website_url: website_url || null,
        logo_url: logo_url || null,
        founded_year: typeof founded_year === "number" ? founded_year : null,
        headquarters: headquarters || null,
      })
      .eq("id", existing.id)
      .select(
        "id, name, slug, website_url, logo_url, founded_year, headquarters, company_type, is_active"
      )
      .single();

    if (updateError || !updated) {
      logger.error("Error updating company", { error: updateError });
      return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }

    // Upsert translations if provided
    if (translations && translations.length > 0) {
      const translationRows = translations.map((t) => ({
        company_id: existing.id,
        language_code: t.language_code,
        description: t.description || null,
      }));

      // company_translations not in generated Supabase types — cast to bypass
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await (supabase as any)
        .from("company_translations")
        .upsert(translationRows, { onConflict: "company_id,language_code" });

      if (upsertError) {
        logger.error("Error upserting company translations", { error: upsertError });
      }
    }

    // company_translations not in generated Supabase types — cast to bypass
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: freshTranslations } = await (supabase as any)
      .from("company_translations")
      .select("language_code, description")
      .eq("company_id", existing.id);

    // Get game count
    const { count: gameCount } = await supabase
      .from("game_companies")
      .select("game_id", { count: "exact", head: true })
      .eq("company_id", existing.id);

    return NextResponse.json({
      company: {
        ...updated,
        gameCount: gameCount || 0,
        translations: (
          (freshTranslations || []) as Array<{ language_code: string; description: string | null }>
        ).map((t) => ({
          language_code: t.language_code,
          description: t.description || "",
        })),
      },
    });
  }
);

/**
 * DELETE /api/admin/companies/[slug] - Delete a company
 * Supports ?force=true to delete even if the company is used by games
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ request, params }) => {
  const { slug } = params;

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const supabase = await createRouteHandlerClient();

  // Check if company exists
  const { data: existing, error: checkError } = await supabase
    .from("companies")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (checkError || !existing) throw notFound("Company not found");

  // Check usage in game_companies
  const { count: usageCount, error: usageError } = await supabase
    .from("game_companies")
    .select("game_id", { count: "exact", head: true })
    .eq("company_id", existing.id);

  if (usageError) {
    logger.error("Error checking company usage", { error: usageError });
    return NextResponse.json({ error: "Failed to check company usage" }, { status: 500 });
  }

  const gameCount = usageCount || 0;

  if (gameCount > 0 && !force) {
    throw conflict("Company is in use", {
      type: "IN_USE",
      usageCount: gameCount,
      message: `This company is used by ${gameCount} game(s). Use ?force=true to delete anyway.`,
    });
  }

  if (gameCount > 0 && force) {
    const { error: cleanupError } = await supabase
      .from("game_companies")
      .delete()
      .eq("company_id", existing.id);

    if (cleanupError) {
      logger.error("Error cleaning up game_companies", { error: cleanupError });
      return NextResponse.json(
        { error: "Failed to remove company references from games" },
        { status: 500 }
      );
    }
  }

  // company_translations not in generated Supabase types — cast to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: translationDeleteError } = await (supabase as any)
    .from("company_translations")
    .delete()
    .eq("company_id", existing.id);

  if (translationDeleteError) {
    logger.error("Error deleting company translations", { error: translationDeleteError });
  }

  // Delete the company
  const { error: deleteError } = await supabase.from("companies").delete().eq("id", existing.id);

  if (deleteError) {
    logger.error("Error deleting company", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
