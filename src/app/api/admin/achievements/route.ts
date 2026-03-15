import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  achievementQuerySchema,
  adminAchievementFormSchema,
} from "@/lib/validations/admin-achievement-form";
import { logger } from "@/lib/logger";
import type { AdminAchievement } from "@/types/admin-achievements";

/** Raw row shape from the achievement_catalog table */
interface AchievementRow {
  id: string;
  key: string;
  category: string;
  tier: string;
  threshold: number;
  xp_value: number;
  icon: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  sort_order: number;
}

const ACHIEVEMENT_COLUMNS =
  "id, key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order";

/** Map a DB row to the AdminAchievement camelCase shape */
function toAdminAchievement(row: AchievementRow): AdminAchievement {
  return {
    id: row.id,
    key: row.key,
    category: row.category as AdminAchievement["category"],
    tier: row.tier as AdminAchievement["tier"],
    threshold: row.threshold,
    xpValue: row.xp_value,
    icon: row.icon,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    descriptionFr: row.description_fr,
    descriptionEn: row.description_en,
    sortOrder: row.sort_order,
  };
}

/**
 * GET /api/admin/achievements — List achievements with pagination, search, sort
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
      locale: searchParams.get("locale") ?? undefined,
    };

    const queryResult = achievementQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search, sort_by, sort_order, locale } = queryResult.data;

    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * limit;

    // Search on key + localized name column
    const applySearchFilter = (query: ReturnType<typeof supabase.from>) => {
      if (!search?.trim()) return query;
      const term = `%${search.trim()}%`;
      const nameCol = locale === "en" ? "name_en" : "name_fr";
      return query.or(`key.ilike.${term},${nameCol}.ilike.${term}`);
    };

    // Count
    const { count: totalCount, error: countError } = await applySearchFilter(
      supabase.from("achievement_catalog").select("id", { count: "exact", head: true })
    );

    if (countError) {
      logger.error("Error counting achievements", { error: countError });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Determine sort column — "name" maps to the locale-specific column
    const sortColumn = sort_by === "name" ? (locale === "en" ? "name_en" : "name_fr") : sort_by;

    const { data: rows, error: dataError } = await applySearchFilter(
      supabase.from("achievement_catalog").select(ACHIEVEMENT_COLUMNS)
    )
      .order(sortColumn, { ascending: sort_order === "asc" })
      .range(offset, offset + limit - 1);

    if (dataError) {
      logger.error("Error fetching achievements", { error: dataError });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const achievements = ((rows || []) as AchievementRow[]).map(toAdminAchievement);
    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      achievements,
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
    logger.error("Error in admin achievements GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/achievements — Create a new achievement
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const validationResult = adminAchievementFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const supabase = await createRouteHandlerClient();

    // Check key uniqueness before insert
    const { data: existing } = await supabase
      .from("achievement_catalog")
      .select("id")
      .eq("key", data.key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Achievement key already exists" }, { status: 409 });
    }

    const { data: created, error: insertError } = await supabase
      .from("achievement_catalog")
      .insert({
        key: data.key,
        category: data.category,
        tier: data.tier,
        threshold: data.threshold,
        xp_value: data.xpValue,
        icon: data.icon,
        name_fr: data.nameFr,
        name_en: data.nameEn,
        description_fr: data.descriptionFr,
        description_en: data.descriptionEn,
        sort_order: data.sortOrder,
      })
      .select(ACHIEVEMENT_COLUMNS)
      .single();

    if (insertError) {
      logger.error("Error creating achievement", { error: insertError });

      // Fallback: handle race condition where key was inserted between check and insert
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Achievement key already exists" }, { status: 409 });
      }

      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(
      { achievement: toAdminAchievement(created as AchievementRow) },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin achievements POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
