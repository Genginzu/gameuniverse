import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { routing } from "@/i18n/routing";
import { getTranslationStats } from "@/lib/services/translationService";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/translations/stats - Translation statistics for all entity types and languages
 */
export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createRouteHandlerClient();

    const stats = await getTranslationStats({
      supabase,
      languages: routing.locales as unknown as string[],
    });

    return NextResponse.json({ stats });
  } catch (error) {
    logger.error("Error in admin translations stats GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
