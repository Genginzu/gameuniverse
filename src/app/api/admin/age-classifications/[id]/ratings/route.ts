import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminRatingFormSchema } from "@/lib/validations/admin-rating-form";
import { logger } from "@/lib/logger";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const supabase = await createRouteHandlerClient();

    // Verify the parent rating system exists
    const { data: system, error: systemError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (systemError || !system) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

    // Fetch ratings with translations
    const { data: ratingsRaw, error } = await supabase
      .from("ratings")
      .select(
        "id, rating_system_id, code, display_name, minimum_age, color_hex, icon_url, sort_order, rating_translations(rating_id, language_code, description)"
      )
      .eq("rating_system_id", id);

    if (error) {
      logger.error("Error fetching ratings", { error });
      return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
    }

    type RatingRow = {
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

    const typedRatings = (ratingsRaw || []) as RatingRow[];

    // Filter by search term (code or display_name, case-insensitive)
    let filtered = typedRatings;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = typedRatings.filter(
        (r) => r.code.toLowerCase().includes(term) || r.display_name.toLowerCase().includes(term)
      );
    }

    // Sort by sort_order
    filtered.sort((a, b) => a.sort_order - b.sort_order);

    // Count game associations per rating
    const ratingIds = filtered.map((r) => r.id);
    let gameCounts: Record<string, number> = {};

    if (ratingIds.length > 0) {
      const { data: gameRatings } = await supabase
        .from("game_ratings")
        .select("rating_id")
        .in("rating_id", ratingIds);

      gameCounts = (gameRatings || []).reduce(
        (acc, gr) => {
          if (gr.rating_id) {
            acc[gr.rating_id] = (acc[gr.rating_id] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );
    }

    const ratings = filtered.map((r) => ({
      id: r.id,
      rating_system_id: r.rating_system_id,
      code: r.code,
      display_name: r.display_name,
      minimum_age: r.minimum_age,
      color_hex: r.color_hex,
      icon_url: r.icon_url,
      sort_order: r.sort_order,
      translations: r.rating_translations.map((t) => ({
        language_code: t.language_code,
        description: t.description,
      })),
      gameCount: gameCounts[r.id] || 0,
    }));

    return NextResponse.json({ ratings });
  } catch (error) {
    logger.error("Error in admin ratings GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/age-classifications/[id]/ratings - Create a new rating with translations
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
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

    // Verify the parent rating system exists
    const { data: system, error: systemError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (systemError || !system) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

    // Check for duplicate code within the same system
    const { data: duplicate } = await supabase
      .from("ratings")
      .select("id")
      .eq("rating_system_id", id)
      .eq("code", code)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "A rating with this code already exists in this system" },
        { status: 409 }
      );
    }

    // Create the rating
    const { data: rating, error: createError } = await supabase
      .from("ratings")
      .insert({
        rating_system_id: id,
        code,
        display_name,
        minimum_age,
        color_hex: color_hex || null,
        icon_url: icon_url || null,
        sort_order,
      })
      .select(
        "id, rating_system_id, code, display_name, minimum_age, color_hex, icon_url, sort_order"
      )
      .single();

    if (createError || !rating) {
      logger.error("Error creating rating", { error: createError });
      return NextResponse.json({ error: "Failed to create rating" }, { status: 500 });
    }

    // Insert translations (rollback rating if this fails)
    if (translations.length > 0) {
      const translationRows = translations.map((t) => ({
        rating_id: rating.id,
        language_code: t.language_code,
        description: t.description,
      }));

      // Cast to any because rating_translations is not yet in generated Supabase types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: translationError } = await (supabase as any)
        .from("rating_translations")
        .insert(translationRows);

      if (translationError) {
        logger.error("Error creating rating translations", { error: translationError });
        // Rollback: delete the rating we just created
        await supabase.from("ratings").delete().eq("id", rating.id);
        return NextResponse.json(
          { error: "Failed to create rating translations" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        rating: {
          ...rating,
          translations: translations.map((t) => ({
            language_code: t.language_code,
            description: t.description,
          })),
          gameCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin ratings POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
