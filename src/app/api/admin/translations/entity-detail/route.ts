import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { getEntityTranslationDetail } from "@/lib/services/translationService";
import { routing } from "@/i18n/routing";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { EntityType } from "@/types/admin-translations";

const querySchema = z.object({
  type: z.enum([
    "games",
    "characters",
    "genres",
    "companies",
    "platforms",
    "character_roles",
    "genders",
    "species",
    "content_descriptors",
    "ratings",
  ]),
  entityId: z.string().uuid(),
});

/**
 * GET /api/admin/translations/entity-detail?type=games&entityId=xxx
 * Returns full translation detail for a single entity across all languages.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      type: searchParams.get("type"),
      entityId: searchParams.get("entityId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const detail = await getEntityTranslationDetail({
      supabase,
      entityType: parsed.data.type as EntityType,
      entityId: parsed.data.entityId,
      languages: routing.locales as unknown as string[],
    });

    if (!detail) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    return NextResponse.json({ detail });
  } catch (error) {
    logger.error("Error in admin translations entity-detail GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
