import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminRatingFormSchema } from "@/lib/validations/admin-rating-form";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ id: string; ratingId: string }> };

/**
 * GET /api/admin/age-classifications/[id]/ratings/[ratingId] - Get a single rating with translations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { ratingId } = await params;

    const supabase = await createRouteHandlerClient();

    const { data: rating, error } = await supabase
      .from("ratings")
      .select(
        "id, rating_system_id, code, display_name, minimum_age, color_hex, icon_url, sort_order, rating_translations(rating_id, language_code, description)"
      )
      .eq("id", ratingId)
      .single();

    if (error || !rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    type RatingWithTranslations = {
      id: string;
      rating_system_id: string;
      code: string;
      display_name: string;
      minimum_age: number;
      color_hex: string | null;
      icon_url: string | null;
      sort_order: number;
      rating_translations: {
        rating_id: string;
        language_code: string;
        description: string;
      }[];
    };

    const typedRating = rating as unknown as RatingWithTranslations;

    // Count game associations
    const { count } = await supabase
      .from("game_ratings")
      .select("id", { count: "exact", head: true })
      .eq("rating_id", ratingId);

    const translations = (typedRating.rating_translations || []).map((t) => ({
      language_code: t.language_code,
      description: t.description,
    }));

    return NextResponse.json({
      rating: {
        id: typedRating.id,
        rating_system_id: typedRating.rating_system_id,
        code: typedRating.code,
        display_name: typedRating.display_name,
        minimum_age: typedRating.minimum_age,
        color_hex: typedRating.color_hex,
        icon_url: typedRating.icon_url,
        sort_order: typedRating.sort_order,
        translations,
        gameCount: count || 0,
      },
    });
  } catch (error) {
    logger.error("Error in admin rating GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/age-classifications/[id]/ratings/[ratingId] - Update a rating with translations
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id, ratingId } = await params;
    const body = await request.json();

    const validationResult = adminRatingFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { code, display_name, minimum_age, color_hex, icon_url, sort_order, translations } =
      validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Check if rating exists
    const { data: existing, error: checkError } = await supabase
      .from("ratings")
      .select("id, rating_system_id")
      .eq("id", ratingId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    // Check for duplicate code within the same system (excluding current rating)
    const { data: duplicate } = await supabase
      .from("ratings")
      .select("id")
      .eq("rating_system_id", id)
      .eq("code", code)
      .neq("id", ratingId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "A rating with this code already exists in this system" },
        { status: 409 }
      );
    }

    // Update the rating fields (no description column)
    const { error: updateError } = await supabase
      .from("ratings")
      .update({
        code,
        display_name,
        minimum_age,
        color_hex: color_hex || null,
        icon_url: icon_url || null,
        sort_order,
      })
      .eq("id", ratingId);

    if (updateError) {
      logger.error("Error updating rating", { error: updateError });
      return NextResponse.json({ error: "Failed to update rating" }, { status: 500 });
    }

    // Upsert translations: delete existing, then insert new
    // Cast to any because rating_translations is not yet in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteTransError } = await (supabase as any)
      .from("rating_translations")
      .delete()
      .eq("rating_id", ratingId);

    if (deleteTransError) {
      logger.error("Error deleting rating translations", { error: deleteTransError });
      return NextResponse.json({ error: "Failed to update rating translations" }, { status: 500 });
    }

    if (translations.length > 0) {
      const translationRows = translations.map((t) => ({
        rating_id: ratingId,
        language_code: t.language_code,
        description: t.description,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertTransError } = await (supabase as any)
        .from("rating_translations")
        .insert(translationRows);

      if (insertTransError) {
        logger.error("Error inserting rating translations", { error: insertTransError });
        return NextResponse.json(
          { error: "Failed to update rating translations" },
          { status: 500 }
        );
      }
    }

    // Count game associations
    const { count } = await supabase
      .from("game_ratings")
      .select("id", { count: "exact", head: true })
      .eq("rating_id", ratingId);

    return NextResponse.json({
      rating: {
        id: ratingId,
        rating_system_id: existing.rating_system_id,
        code,
        display_name,
        minimum_age,
        color_hex: color_hex || null,
        icon_url: icon_url || null,
        sort_order,
        translations: translations.map((t) => ({
          language_code: t.language_code,
          description: t.description,
        })),
        gameCount: count || 0,
      },
    });
  } catch (error) {
    logger.error("Error in admin rating PUT", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/age-classifications/[id]/ratings/[ratingId] - Delete a rating
 * Translations are deleted by cascade. Only allowed if not associated with games.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { ratingId } = await params;

    const supabase = await createRouteHandlerClient();

    // Check if rating exists
    const { data: existing, error: checkError } = await supabase
      .from("ratings")
      .select("id")
      .eq("id", ratingId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    // Check for game associations
    const { count: usageCount } = await supabase
      .from("game_ratings")
      .select("id", { count: "exact", head: true })
      .eq("rating_id", ratingId);

    if (usageCount && usageCount > 0) {
      return NextResponse.json(
        {
          error: "Rating is in use",
          type: "IN_USE",
          usageCount,
        },
        { status: 409 }
      );
    }

    // Delete the rating (translations are deleted by CASCADE)
    const { error: deleteError } = await supabase.from("ratings").delete().eq("id", ratingId);

    if (deleteError) {
      logger.error("Error deleting rating", { error: deleteError });
      return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in admin rating DELETE", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
