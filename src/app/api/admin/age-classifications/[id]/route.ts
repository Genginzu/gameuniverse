import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute, notFound } from "@/lib/api/route";
import { adminRatingSystemFormSchema } from "@/lib/validations/admin-rating-system-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/age-classifications/[id] - Get a single rating system with counts
 */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;

  const supabase = await createRouteHandlerClient();

  const { data: system, error } = await supabase
    .from("rating_systems")
    .select("id, code, name, description, country_codes, website_url")
    .eq("id", id)
    .single();

  if (error || !system) throw notFound("Rating system not found");

  // Count ratings and descriptors
  const [ratingsResult, descriptorsResult] = await Promise.all([
    supabase
      .from("ratings")
      .select("id", { count: "exact", head: true })
      .eq("rating_system_id", system.id),
    supabase
      .from("content_descriptors")
      .select("id", { count: "exact", head: true })
      .eq("rating_system_id", system.id),
  ]);

  return NextResponse.json({
    ratingSystem: {
      id: system.id,
      code: system.code,
      name: system.name,
      description: system.description,
      country_codes: system.country_codes || [],
      website_url: system.website_url,
      ratingsCount: ratingsResult.count || 0,
      descriptorsCount: descriptorsResult.count || 0,
    },
  });
});

/**
 * PUT /api/admin/age-classifications/[id] - Update a rating system
 */
export const PUT = defineRoute(
  { auth: "admin", body: adminRatingSystemFormSchema },
  async ({ params, body }) => {
    const { id } = params;
    const { code, name, description, country_codes, website_url } = body;

    const supabase = await createRouteHandlerClient();

    // Check if rating system exists
    const { data: existing, error: checkError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) throw notFound("Rating system not found");

    // Check for code uniqueness (if code changed)
    const { data: duplicate, error: dupError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("code", code)
      .neq("id", id)
      .maybeSingle();

    if (dupError) {
      logger.error("Error checking duplicate code", { error: dupError });
      return NextResponse.json({ error: "Failed to check for duplicates" }, { status: 500 });
    }

    if (duplicate) throw conflict("A rating system with this code already exists");

    // Update the rating system
    const { data: updated, error: updateError } = await supabase
      .from("rating_systems")
      .update({
        code,
        name,
        description: description || null,
        country_codes: country_codes || [],
        website_url: website_url || null,
      })
      .eq("id", id)
      .select("id, code, name, description, country_codes, website_url")
      .single();

    if (updateError || !updated) {
      logger.error("Error updating rating system", { error: updateError });
      return NextResponse.json({ error: "Failed to update rating system" }, { status: 500 });
    }

    // Count ratings and descriptors
    const [ratingsResult, descriptorsResult] = await Promise.all([
      supabase
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .eq("rating_system_id", id),
      supabase
        .from("content_descriptors")
        .select("id", { count: "exact", head: true })
        .eq("rating_system_id", id),
    ]);

    return NextResponse.json({
      ratingSystem: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description,
        country_codes: updated.country_codes || [],
        website_url: updated.website_url,
        ratingsCount: ratingsResult.count || 0,
        descriptorsCount: descriptorsResult.count || 0,
      },
    });
  }
);

/**
 * DELETE /api/admin/age-classifications/[id] - Delete a rating system
 * Only allowed if no ratings or content_descriptors are associated
 */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const { id } = params;

  const supabase = await createRouteHandlerClient();

  // Check if rating system exists
  const { data: existing, error: checkError } = await supabase
    .from("rating_systems")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !existing) throw notFound("Rating system not found");

  // Check for associated ratings and descriptors
  const [ratingsResult, descriptorsResult] = await Promise.all([
    supabase
      .from("ratings")
      .select("id", { count: "exact", head: true })
      .eq("rating_system_id", id),
    supabase
      .from("content_descriptors")
      .select("id", { count: "exact", head: true })
      .eq("rating_system_id", id),
  ]);

  const ratingsCount = ratingsResult.count || 0;
  const descriptorsCount = descriptorsResult.count || 0;
  const totalUsage = ratingsCount + descriptorsCount;

  if (totalUsage > 0) {
    throw conflict("Rating system is in use", {
      type: "IN_USE",
      usageCount: totalUsage,
      ratingsCount,
      descriptorsCount,
    });
  }

  // Delete the rating system
  const { error: deleteError } = await supabase.from("rating_systems").delete().eq("id", id);

  if (deleteError) {
    logger.error("Error deleting rating system", { error: deleteError });
    return NextResponse.json({ error: "Failed to delete rating system" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
