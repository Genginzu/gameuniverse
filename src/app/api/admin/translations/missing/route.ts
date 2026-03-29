import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { missingQuerySchema } from "@/lib/validations/admin-translation";
import { getMissingTranslations } from "@/lib/services/translationService";
import { routing } from "@/i18n/routing";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/translations/missing
 * Lists entities with missing translations in any supported language.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | undefined> = {
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const queryResult = missingQuerySchema.safeParse(rawParams);
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { type, page, limit, search } = queryResult.data;
    const supabase = await createRouteHandlerClient();

    const { items, totalCount } = await getMissingTranslations({
      supabase,
      entityType: type,
      languages: routing.locales as unknown as string[],
      page,
      limit,
      search,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        items,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    logger.error("Error in admin translations missing GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
