import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute } from "@/lib/api/route";
import { missingQuerySchema } from "@/lib/validations/admin-translation";
import { listTranslationEntities } from "@/lib/services/translationService";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/translations/missing?status=missing|complete
 * Lists entities missing a translation (default) or complete in every supported language.
 */
export const GET = defineRoute({ auth: "admin", query: missingQuerySchema }, async ({ query }) => {
  const { type, status, page, limit, search } = query;
  // get_translation_entities is service_role only (migration 20261027000001).
  const supabase = getSupabaseAdmin();

  const { items, totalCount } = await listTranslationEntities({
    supabase,
    entityType: type,
    status,
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
});
