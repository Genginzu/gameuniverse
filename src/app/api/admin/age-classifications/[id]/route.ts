import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminRatingSystemFormSchema } from "@/lib/validations/admin-rating-system-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/age-classifications/[id] - Get a single rating system with counts
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Rating system ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    const { data: system, error } = await supabase
      .from("rating_systems")
      .select("id, code, name, description, country_codes, website_url")
      .eq("id", id)
      .single();

    if (error || !system) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

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
  } catch (error) {
    logger.error("Error in admin age-classification GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/age-classifications/[id] - Update a rating system
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Rating system ID is required" }, { status: 400 });
    }

    const body = await request.json();

    const validationResult = adminRatingSystemFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { code, name, description, country_codes, website_url } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if rating system exists
    const { data: existing, error: checkError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

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

    if (duplicate) {
      return NextResponse.json(
        { error: "A rating system with this code already exists" },
        { status: 409 }
      );
    }

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
  } catch (error) {
    logger.error("Error in admin age-classification PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/age-classifications/[id] - Delete a rating system
 * Only allowed if no ratings or content_descriptors are associated
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Rating system ID is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Check if rating system exists
    const { data: existing, error: checkError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

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
      return NextResponse.json(
        {
          error: "Rating system is in use",
          type: "IN_USE",
          usageCount: totalUsage,
          ratingsCount,
          descriptorsCount,
        },
        { status: 409 }
      );
    }

    // Delete the rating system
    const { error: deleteError } = await supabase.from("rating_systems").delete().eq("id", id);

    if (deleteError) {
      logger.error("Error deleting rating system", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete rating system" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin age-classification DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
