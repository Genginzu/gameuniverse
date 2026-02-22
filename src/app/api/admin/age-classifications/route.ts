import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  adminRatingSystemFormSchema,
  ratingSystemQuerySchema,
} from "@/lib/validations/admin-rating-system-form";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/age-classifications - List rating systems with pagination, search, and sort
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const rawParams: Record<string, string | undefined> = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort_by: searchParams.get("sort_by") ?? undefined,
      sort_order: searchParams.get("sort_order") ?? undefined,
    };

    const queryResult = ratingSystemQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabase.from("rating_systems").select("id", { count: "exact", head: true });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      countQuery = countQuery.or(`code.ilike.${term},name.ilike.${term}`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting rating systems", { error: countError });
      return NextResponse.json({ error: "Failed to count rating systems" }, { status: 500 });
    }

    // Build data query
    let query = supabase
      .from("rating_systems")
      .select("id, code, name, description, country_codes, website_url");

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`code.ilike.${term},name.ilike.${term}`);
    }

    const { data: systems, error } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching rating systems", { error });
      return NextResponse.json({ error: "Failed to fetch rating systems" }, { status: 500 });
    }

    // Count ratings and descriptors per system
    const systemsWithCounts = await Promise.all(
      (systems || []).map(async (system) => {
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

        return {
          id: system.id,
          code: system.code,
          name: system.name,
          description: system.description,
          country_codes: system.country_codes || [],
          website_url: system.website_url,
          ratingsCount: ratingsResult.count || 0,
          descriptorsCount: descriptorsResult.count || 0,
        };
      })
    );

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      ratingSystems: systemsWithCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error in admin age-classifications GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/age-classifications - Create a new rating system
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

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

    const { data: ratingSystem, error } = await supabase
      .from("rating_systems")
      .insert([
        {
          code,
          name,
          description: description || null,
          country_codes: country_codes || [],
          website_url: website_url || null,
        },
      ])
      .select("id, code, name, description, country_codes, website_url")
      .single();

    if (error) {
      logger.error("Error creating rating system", { error });

      // Unique constraint violation (code already exists)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A rating system with this code already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to create rating system" }, { status: 500 });
    }

    return NextResponse.json(
      {
        ratingSystem: {
          ...ratingSystem,
          country_codes: ratingSystem.country_codes || [],
          ratingsCount: 0,
          descriptorsCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin age-classifications POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
