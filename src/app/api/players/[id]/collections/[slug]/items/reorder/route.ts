import { NextResponse } from "next/server";
import { reorderItems } from "@/lib/services/collectionService";
import { reorderCollectionItemsSchema } from "@/lib/validations/collection";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";

/**
 * PATCH /api/players/[id]/collections/[slug]/items/reorder — Réordonner les jeux d'une collection.
 * Authentification requise. Seul le propriétaire peut réordonner les jeux.
 */
export const PATCH = defineRoute(
  { auth: "required", body: reorderCollectionItemsSchema },
  async ({ user, params, body }) => {
    const { id: playerId, slug } = params;

    if (!playerId || !slug) {
      throw validationError(undefined, "Player ID and slug are required");
    }

    if (user.id !== playerId) {
      throw forbidden("Forbidden");
    }

    await reorderItems(user.id, slug, body.items);

    return NextResponse.json({ success: true }, { status: 200 });
  }
);
