import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  fetchCollectionDetail,
  updateCollection,
  deleteCollection,
} from "@/lib/services/collectionService";
import { CollectionAdvancedStatsService } from "@/lib/services/collectionAdvancedStatsService";
import { updateCollectionSchema } from "@/lib/validations/collection";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";

type RouteContext = { params: Promise<{ id: string; slug: string }> };

/**
 * GET /api/players/[id]/collections/[slug] — Détail d'une collection.
 * Retourne 404 si la collection est privée et l'utilisateur n'est pas le propriétaire.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, slug } = await params;

    if (!playerId || !slug) {
      return NextResponse.json({ error: "Player ID and slug are required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const collection = await fetchCollectionDetail(playerId, slug, user?.id, locale);

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Advanced stats: computed from the collection's games + owner library.
    const stats = await CollectionAdvancedStatsService.computeForGames(
      collection.items.map((item) => item.gameId),
      collection.userId,
      locale
    );

    return NextResponse.json({ collection, stats });
  } catch (error) {
    logger.error("Error in collection GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/players/[id]/collections/[slug] — Modifier une collection.
 * Authentification requise. Seul le propriétaire peut modifier.
 * Le slug n'est pas modifié.
 */
export const PATCH = defineRoute(
  {
    auth: "required",
    rateLimit: "collection",
    writesContent: true,
    body: updateCollectionSchema,
  },
  async ({ user, params, body }) => {
    const { id: playerId, slug } = params;

    if (!playerId || !slug) {
      throw validationError(undefined, "Player ID and slug are required");
    }

    if (user.id !== playerId) {
      throw forbidden("Forbidden");
    }

    const result = await updateCollection(user.id, slug, body);

    return NextResponse.json({ collection: result });
  }
);

/**
 * DELETE /api/players/[id]/collections/[slug] — Supprimer une collection.
 * Authentification requise. Seul le propriétaire peut supprimer.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { id: playerId, slug } = params;

  if (!playerId || !slug) {
    throw validationError(undefined, "Player ID and slug are required");
  }

  if (user.id !== playerId) {
    throw forbidden("Forbidden");
  }

  await deleteCollection(user.id, slug);

  return new NextResponse(null, { status: 204 });
});
