import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminCompanyFormSchema } from "@/lib/validations/admin-company-form";

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * GET /api/admin/companies/[slug] - Get a single company with translations and game count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Company slug is required" }, { status: 400 });
    }

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

    if (error || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { count: gameCount, error: countError } = await supabase
      .from("game_companies")
      .select("game_id", { count: "exact", head: true })
      .eq("company_id", company.id);

    if (countError) {
      console.error("Error counting company games:", countError);
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
  } catch (error) {
    console.error("Error in admin company GET:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Validation schema for PUT body (slug is immutable, not in body)
const updateCompanySchema = adminCompanyFormSchema.omit({ slug: true });

/**
 * PUT /api/admin/companies/[slug] - Update a company with translations
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Company slug is required" }, { status: 400 });
    }

    const body = await request.json();

    const validationResult = updateCompanySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, company_type, website_url, logo_url, founded_year, headquarters, translations } =
      validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

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
      console.error("Error updating company:", updateError);
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
      const { error: upsertError } = await (supabase as any)
        .from("company_translations")
        .upsert(translationRows, { onConflict: "company_id,language_code" });

      if (upsertError) {
        console.error("Error upserting company translations:", upsertError);
      }
    }

    // company_translations not in generated Supabase types — cast to bypass
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
  } catch (error) {
    console.error("Error in admin company PUT:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/companies/[slug] - Delete a company
 * Supports ?force=true to delete even if the company is used by games
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Company slug is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const supabase = await createRouteHandlerClient();

    // Check if company exists
    const { data: existing, error: checkError } = await supabase
      .from("companies")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check usage in game_companies
    const { count: usageCount, error: usageError } = await supabase
      .from("game_companies")
      .select("game_id", { count: "exact", head: true })
      .eq("company_id", existing.id);

    if (usageError) {
      console.error("Error checking company usage:", usageError);
      return NextResponse.json({ error: "Failed to check company usage" }, { status: 500 });
    }

    const gameCount = usageCount || 0;

    if (gameCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Company is in use",
          type: "IN_USE",
          usageCount: gameCount,
          message: `This company is used by ${gameCount} game(s). Use ?force=true to delete anyway.`,
        },
        { status: 409 }
      );
    }

    if (gameCount > 0 && force) {
      const { error: cleanupError } = await supabase
        .from("game_companies")
        .delete()
        .eq("company_id", existing.id);

      if (cleanupError) {
        console.error("Error cleaning up game_companies:", cleanupError);
        return NextResponse.json(
          { error: "Failed to remove company references from games" },
          { status: 500 }
        );
      }
    }

    // company_translations not in generated Supabase types — cast to bypass
    const { error: translationDeleteError } = await (supabase as any)
      .from("company_translations")
      .delete()
      .eq("company_id", existing.id);

    if (translationDeleteError) {
      console.error("Error deleting company translations:", translationDeleteError);
    }

    // Delete the company
    const { error: deleteError } = await supabase.from("companies").delete().eq("id", existing.id);

    if (deleteError) {
      console.error("Error deleting company:", deleteError);
      return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin company DELETE:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
