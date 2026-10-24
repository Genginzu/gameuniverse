import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { conflict, defineRoute } from "@/lib/api/route";
import {
  adminLanguageFormSchema,
  languageQuerySchema,
} from "@/lib/validations/admin-language-form";
import { logger } from "@/lib/logger";
import { ilikeAnyFilter } from "@/lib/utils/postgrestFilter";

/**
 * GET /api/admin/languages - List supported languages with pagination, search, and sort
 */
export const GET = defineRoute(
  { auth: "admin", query: languageQuerySchema },
  async ({ query: listQuery }) => {
    const { page, limit, search, sort_by, sort_order } = listQuery;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabase
      .from("supported_languages")
      .select("code", { count: "exact", head: true });

    if (search?.trim()) {
      countQuery = countQuery.or(ilikeAnyFilter(["code", "name"], search));
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error counting languages", { error: countError });
      return NextResponse.json({ error: "Failed to count languages" }, { status: 500 });
    }

    // Build data query
    let query = supabase.from("supported_languages").select("code, name, native_name");

    if (search?.trim()) {
      query = query.or(ilikeAnyFilter(["code", "name"], search));
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
  }
);

/**
 * POST /api/admin/languages - Create a new supported language
 */
export const POST = defineRoute(
  { auth: "admin", body: adminLanguageFormSchema },
  async ({ body }) => {
    const { code, name, native_name } = body;

    const supabase = await createRouteHandlerClient();

    // Insert the new language
    const { data: language, error } = await supabase
      .from("supported_languages")
      .insert([{ code, name, native_name: native_name ?? "" }])
      .select("code, name, native_name")
      .single();

    if (error) {
      // Unique constraint violation (code already exists)
      if (error.code === "23505") throw conflict("A language with this code already exists");
      logger.error("Error creating language", { error });
      return NextResponse.json({ error: "Failed to create language" }, { status: 500 });
    }

    return NextResponse.json({ language }, { status: 201 });
  }
);
