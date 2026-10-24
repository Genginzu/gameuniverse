import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute } from "@/lib/api/route";
import { missingQuerySchema } from "@/lib/validations/admin-translation";
import { getMissingTranslations } from "@/lib/services/translationService";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/translations/missing
 * Lists entities with missing translations in any supported language.
 */
export const GET = defineRoute({ auth: "admin", query: missingQuerySchema }, async ({ query }) => {
  const { type, page, limit, search } = query;
  // get_missing_translations is service_role only (migration 20261019000002).
  const supabase = getSupabaseAdmin();

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
});
