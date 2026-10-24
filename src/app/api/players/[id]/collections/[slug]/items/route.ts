import { NextResponse } from "next/server";
import { addItem } from "@/lib/services/collectionService";
import { addCollectionItemSchema } from "@/lib/validations/collection";
import { logger } from "@/lib/logger";
import { CoinService } from "@/lib/services/coinService";
import { conflict, defineRoute, forbidden, validationError } from "@/lib/api/route";

/**
 * POST /api/players/[id]/collections/[slug]/items — Ajouter un jeu à une collection.
 * Authentification requise. Seul le propriétaire peut ajouter des jeux.
 * Retourne 409 si le jeu est déjà présent (contrainte UNIQUE).
 */
export const POST = defineRoute(
  { auth: "required", rateLimit: "collectionItem", body: addCollectionItemSchema },
  async ({ user, params, body }) => {
    const { id: playerId, slug } = params;

    if (!playerId || !slug) {
      throw validationError(undefined, "Player ID and slug are required");
    }

    if (user.id !== playerId) {
      throw forbidden("Forbidden");
    }

    try {
      await addItem(user.id, slug, body);
    } catch (error) {
      // Handle unique constraint violation (duplicate game in collection)
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        throw conflict("Ce jeu est déjà dans la collection");
      }
      throw error;
    }

    CoinService.rewardActivity(user.id, "collection_add", body.gameId).catch((err) =>
      logger.error("Coin reward failed", { error: err })
    );

    return NextResponse.json({ success: true }, { status: 201 });
  }
);
