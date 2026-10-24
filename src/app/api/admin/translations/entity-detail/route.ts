import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound } from "@/lib/api/route";
import { getEntityTranslationDetail } from "@/lib/services/translationService";
import { routing } from "@/i18n/routing";
import { z } from "zod";
import type { EntityType } from "@/types/admin-translations";

export const dynamic = "force-dynamic";

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
export const GET = defineRoute({ auth: "admin", query: querySchema }, async ({ query }) => {
  const supabase = await createRouteHandlerClient();
  const detail = await getEntityTranslationDetail({
    supabase,
    entityType: query.type as EntityType,
    entityId: query.entityId,
    languages: routing.locales as unknown as string[],
  });

  if (!detail) throw notFound("Entity not found");

  return NextResponse.json(
    { detail },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
});
