import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound } from "@/lib/api/route";
import { adminSpeciesFormSchema } from "@/lib/validations/admin-species-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/species/[id] - Get a single species with all translations and character count
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;

  const supabase = await createRouteHandlerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: species, error } = await db
    .from("species")
    .select("id, slug, igdb_id, species_translations(species_id, language_code, name)")
    .eq("id", id)
    .single();

  if (error || !species) throw notFound("Species not found");

  const { count: characterCount, error: countError } = await db
    .from("characters")
    .select("id", { count: "exact", head: true })
    .eq("species_id", species.id);

  if (countError) {
    logger.error("Error counting species characters", { error: countError });
  }

  return NextResponse.json({
    species: {
      id: species.id,
      slug: species.slug,
      igdbId: species.igdb_id,
      characterCount: characterCount || 0,
      translations: (species.species_translations || []).map(
        (t: { language_code: string; name: string }) => ({
          language_code: t.language_code,
          name: t.name,
        })
      ),
    },
  });
});

/**
 * PUT /api/admin/species/[id] - Update species slug and translations
 */
export const PUT = defineRoute(
  { auth: "admin", body: adminSpeciesFormSchema },
  async ({ params, body }) => {
    const { id } = params;
    const { slug, translations } = body;

    const supabase = await createRouteHandlerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Check if species exists
    const { data: existing, error: checkError } = await db
      .from("species")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) throw notFound("Species not found");

    // Update slug
    const { error: updateError } = await db
      .from("species")
      .update({ slug, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      if (updateError.code === "23505") throw conflict("A species with this slug already exists");
      logger.error("Error updating species", { error: updateError });
      return NextResponse.json({ error: "Failed to update species" }, { status: 500 });
    }

    // Upsert translations
    const translationRows = translations.map((t) => ({
      species_id: id,
      language_code: t.language_code,
      name: t.name,
    }));

    const { error: upsertError } = await db
      .from("species_translations")
      .upsert(translationRows, { onConflict: "species_id,language_code" });

    if (upsertError) {
      logger.error("Error upserting species translations", { error: upsertError });
      return NextResponse.json({ error: "Failed to update species translations" }, { status: 500 });
    }

    // Fetch updated species
    const { data: updated, error: fetchError } = await db
      .from("species")
      .select("id, slug, igdb_id, species_translations(species_id, language_code, name)")
      .eq("id", id)
      .single();

    if (fetchError || !updated) {
      return NextResponse.json({ error: "Failed to fetch updated species" }, { status: 500 });
    }

    const { count: characterCount } = await db
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("species_id", id);

    return NextResponse.json({
      species: {
        id: updated.id,
        slug: updated.slug,
        igdbId: updated.igdb_id,
        characterCount: characterCount || 0,
        translations: (updated.species_translations || []).map(
          (t: { language_code: string; name: string }) => ({
            language_code: t.language_code,
            name: t.name,
          })
        ),
      },
    });
  }
);

/**
 * DELETE /api/admin/species/[id] - Delete a species
 * Characters FK is ON DELETE SET NULL so no manual cleanup needed.
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;

  const supabase = await createRouteHandlerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if species exists
  const { data: existing, error: checkError } = await db
    .from("species")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !existing) throw notFound("Species not found");

  // Check character usage for informational purposes
  const { count: characterCount, error: usageError } = await db
    .from("characters")
    .select("id", { count: "exact", head: true })
    .eq("species_id", id);

  if (usageError) {
    logger.error("Error checking species usage", { error: usageError });
  }

  // Delete translations first (cascade should handle this, but explicit is safer)
  const { error: translationDeleteError } = await db
    .from("species_translations")
    .delete()
    .eq("species_id", id);

  if (translationDeleteError) {
    logger.error("Error deleting species translations", { error: translationDeleteError });
    return NextResponse.json({ error: "Failed to delete species translations" }, { status: 500 });
  }

  // Delete the species — characters.species_id will be SET NULL automatically
  const { error: deleteError } = await db.from("species").delete().eq("id", id);

  if (deleteError) {
    logger.error("Error deleting species", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete species" }, { status: 500 });
  }

  return NextResponse.json({ success: true, characterCount: characterCount || 0 });
});
