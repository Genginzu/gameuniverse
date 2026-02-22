import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminLanguageFormSchema } from "@/lib/validations/admin-language-form";
import { logger } from "@/lib/logger";

// Query params validation schema
const languageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["code", "name"]).default("code"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/admin/languages - List supported languages with pagination, search, and sort
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

    const queryResult = languageQuerySchema.safeParse(rawParams);

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
    let countQuery = supabase
      .from("supported_languages")
      .select("code", { count: "exact", head: true });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      countQuery = countQuery.or(`code.ilike.${term},name.ilike.${term}`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting languages", { error: countError });
      return NextResponse.json({ error: "Failed to count languages" }, { status: 500 });
    }

    // Build data query
    let query = supabase.from("supported_languages").select("code, name, native_name");

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`code.ilike.${term},name.ilike.${term}`);
    }

    const { data: languages, error } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching languages", { error });
      return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 });
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      languages: languages || [],
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
    logger.error("Error in admin languages GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/languages - Create a new supported language
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    // Server-side Zod validation
    const validationResult = adminLanguageFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { code, name, native_name } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Insert the new language
    const { data: language, error } = await supabase
      .from("supported_languages")
      .insert([{ code, name, native_name: native_name || null }])
      .select("code, name, native_name")
      .single();

    if (error) {
      logger.error("Error creating language", { error });

      // Unique constraint violation (code already exists)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A language with this code already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: "Failed to create language" }, { status: 500 });
    }

    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    logger.error("Error in admin languages POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
