import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound } from "@/lib/api/route";
import { adminDescriptorFormSchema } from "@/lib/validations/admin-descriptor-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/age-classifications/[id]/descriptors/[descriptorId]
 * Get a single content descriptor with translations and game count
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { descriptorId } = params;

  const supabase = await createRouteHandlerClient();

  const { data: descriptor, error } = await supabase
    .from("content_descriptors")
    .select(
      "id, rating_system_id, code, icon_url, content_descriptor_translations(content_descriptor_id, language_code, name, description)"
    )
    .eq("id", descriptorId)
    .single();

  if (error || !descriptor) throw notFound("Content descriptor not found");

  // Count game associations
  const { count } = await supabase
    .from("game_rating_descriptors")
    .select("id", { count: "exact", head: true })
    .eq("content_descriptor_id", descriptorId);

  type TranslationRow = {
    content_descriptor_id: string;
    language_code: string;
    name: string;
    description: string | null;
  };

  const translations = ((descriptor.content_descriptor_translations || []) as TranslationRow[]).map(
    (t) => ({
      language_code: t.language_code,
      name: t.name,
      description: t.description || "",
    })
  );

  return NextResponse.json({
    descriptor: {
      id: descriptor.id,
      rating_system_id: descriptor.rating_system_id,
      code: descriptor.code,
      icon_url: descriptor.icon_url,
      translations,
      gameCount: count || 0,
    },
  });
});

/**
 * PUT /api/admin/age-classifications/[id]/descriptors/[descriptorId]
 * Update a content descriptor and upsert its translations
 */
export const PUT = defineRoute(
  { auth: "admin", body: adminDescriptorFormSchema },
  async ({ params, body }) => {
    const { id, descriptorId } = params;
    const { code, icon_url, translations } = body;

    const supabase = await createRouteHandlerClient();

    // Check if descriptor exists
    const { data: existing, error: checkError } = await supabase
      .from("content_descriptors")
      .select("id, rating_system_id")
      .eq("id", descriptorId)
      .single();

    if (checkError || !existing) throw notFound("Content descriptor not found");

    // Check for duplicate code within the same system (excluding current descriptor)
    const { data: duplicate } = await supabase
      .from("content_descriptors")
      .select("id")
      .eq("rating_system_id", id)
      .eq("code", code)
      .neq("id", descriptorId)
      .maybeSingle();

    if (duplicate) {
      throw conflict("A content descriptor with this code already exists in this system");
    }

    // Update the descriptor fields
    const { error: updateError } = await supabase
      .from("content_descriptors")
      .update({ code, icon_url: icon_url || null })
      .eq("id", descriptorId);

    if (updateError) {
      logger.error("Error updating descriptor", { error: updateError });
      return NextResponse.json({ error: "Failed to update descriptor" }, { status: 500 });
    }

    // Upsert translations: delete existing, then insert new
    const { error: deleteTransError } = await supabase
      .from("content_descriptor_translations")
      .delete()
      .eq("content_descriptor_id", descriptorId);

    if (deleteTransError) {
      logger.error("Error deleting descriptor translations", { error: deleteTransError });
      return NextResponse.json(
        { error: "Failed to update descriptor translations" },
        { status: 500 }
      );
    }

    const translationRows = translations.map((t) => ({
      content_descriptor_id: descriptorId,
      language_code: t.language_code,
      name: t.name,
      description: t.description || null,
    }));

    const { error: insertTransError } = await supabase
      .from("content_descriptor_translations")
      .insert(translationRows);

    if (insertTransError) {
      logger.error("Error inserting descriptor translations", { error: insertTransError });
      return NextResponse.json(
        { error: "Failed to update descriptor translations" },
        { status: 500 }
      );
    }

    // Count game associations
    const { count } = await supabase
      .from("game_rating_descriptors")
      .select("id", { count: "exact", head: true })
      .eq("content_descriptor_id", descriptorId);

    return NextResponse.json({
      descriptor: {
        id: descriptorId,
        rating_system_id: existing.rating_system_id,
        code,
        icon_url: icon_url || null,
        translations: translations.map((t) => ({
          language_code: t.language_code,
          name: t.name,
          description: t.description || "",
        })),
        gameCount: count || 0,
      },
    });
  }
);

/**
 * DELETE /api/admin/age-classifications/[id]/descriptors/[descriptorId]
 * Delete a content descriptor (only if not associated with games)
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { descriptorId } = params;

  const supabase = await createRouteHandlerClient();

  // Check if descriptor exists
  const { data: existing, error: checkError } = await supabase
    .from("content_descriptors")
    .select("id")
    .eq("id", descriptorId)
    .single();

  if (checkError || !existing) throw notFound("Content descriptor not found");

  // Check for game associations
  const { count: usageCount } = await supabase
    .from("game_rating_descriptors")
    .select("id", { count: "exact", head: true })
    .eq("content_descriptor_id", descriptorId);

  if (usageCount && usageCount > 0) {
    throw conflict("Content descriptor is in use", { type: "IN_USE", usageCount });
  }

  // Delete translations first
  const { error: translationDeleteError } = await supabase
    .from("content_descriptor_translations")
    .delete()
    .eq("content_descriptor_id", descriptorId);

  if (translationDeleteError) {
    logger.error("Error deleting descriptor translations", { error: translationDeleteError });
    return NextResponse.json(
      { error: "Failed to delete descriptor translations" },
      { status: 500 }
    );
  }

  // Delete the descriptor
  const { error: deleteError } = await supabase
    .from("content_descriptors")
    .delete()
    .eq("id", descriptorId);

  if (deleteError) {
    logger.error("Error deleting descriptor", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete descriptor" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
