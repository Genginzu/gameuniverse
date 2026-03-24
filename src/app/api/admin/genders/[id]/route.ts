import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminGenderFormSchema } from "@/lib/validations/admin-gender-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/genders/[id] - Get a single gender with all translations and character count
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Gender ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: gender, error } = await db
      .from("genders")
      .select("id, slug, igdb_id, gender_translations(gender_id, language_code, name)")
      .eq("id", id)
      .single();

    if (error || !gender) {
      return NextResponse.json({ error: "Gender not found" }, { status: 404 });
    }

    const { count: characterCount, error: countError } = await db
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("gender_id", gender.id);

    if (countError) {
      logger.error("Error counting gender characters", { error: countError });
    }

    return NextResponse.json({
      gender: {
        id: gender.id,
        slug: gender.slug,
        igdbId: gender.igdb_id,
        characterCount: characterCount || 0,
        translations: (gender.gender_translations || []).map(
          (t: { language_code: string; name: string }) => ({
            language_code: t.language_code,
            name: t.name,
          })
        ),
      },
    });
  } catch (error) {
    logger.error("Error in admin gender GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/genders/[id] - Update gender slug and translations
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Gender ID is required" }, { status: 400 });
    }

    const body = await request.json();

    const validationResult = adminGenderFormSchema.safeParse(body);

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

    // Check if gender exists
    const { data: existing, error: checkError } = await db
      .from("genders")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Gender not found" }, { status: 404 });
    }

    // Update slug
    const { error: updateError } = await db
      .from("genders")
      .update({ slug, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      logger.error("Error updating gender", { error: updateError });

      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "A gender with this slug already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to update gender" }, { status: 500 });
    }

    // Upsert translations
    const translationRows = translations.map((t) => ({
      gender_id: id,
      language_code: t.language_code,
      name: t.name,
    }));

    const { error: upsertError } = await db
      .from("gender_translations")
      .upsert(translationRows, { onConflict: "gender_id,language_code" });

    if (upsertError) {
      logger.error("Error upserting gender translations", { error: upsertError });
      return NextResponse.json({ error: "Failed to update gender translations" }, { status: 500 });
    }

    // Fetch updated gender
    const { data: updated, error: fetchError } = await db
      .from("genders")
      .select("id, slug, igdb_id, gender_translations(gender_id, language_code, name)")
      .eq("id", id)
      .single();

    if (fetchError || !updated) {
      return NextResponse.json({ error: "Failed to fetch updated gender" }, { status: 500 });
    }

    const { count: characterCount } = await db
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("gender_id", id);

    return NextResponse.json({
      gender: {
        id: updated.id,
        slug: updated.slug,
        igdbId: updated.igdb_id,
        characterCount: characterCount || 0,
        translations: (updated.gender_translations || []).map(
          (t: { language_code: string; name: string }) => ({
            language_code: t.language_code,
            name: t.name,
          })
        ),
      },
    });
  } catch (error) {
    logger.error("Error in admin gender PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/genders/[id] - Delete a gender
 * Characters FK is ON DELETE SET NULL so no manual cleanup needed.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Gender ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Check if gender exists
    const { data: existing, error: checkError } = await db
      .from("genders")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Gender not found" }, { status: 404 });
    }

    // Check character usage for informational purposes
    const { count: characterCount, error: usageError } = await db
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("gender_id", id);

    if (usageError) {
      logger.error("Error checking gender usage", { error: usageError });
    }

    // Delete translations first (cascade should handle this, but explicit is safer)
    const { error: translationDeleteError } = await db
      .from("gender_translations")
      .delete()
      .eq("gender_id", id);

    if (translationDeleteError) {
      logger.error("Error deleting gender translations", { error: translationDeleteError });
      return NextResponse.json({ error: "Failed to delete gender translations" }, { status: 500 });
    }

    // Delete the gender — characters.gender_id will be SET NULL automatically
    const { error: deleteError } = await db.from("genders").delete().eq("id", id);

    if (deleteError) {
      logger.error("Error deleting gender", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete gender" }, { status: 500 });
    }

    return NextResponse.json({ success: true, characterCount: characterCount || 0 });
  } catch (error) {
    logger.error("Error in admin gender DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
