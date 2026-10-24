import { NextResponse } from "next/server";
import { z } from "zod";
import { removeItem, updateItemNote } from "@/lib/services/collectionService";
import { defineRoute, forbidden, validationError } from "@/lib/api/route";

const NOTE_MAX_LENGTH = 250;

// The note is checked in the handler so the dedicated 400 messages stay unchanged.
const updateNoteSchema = z.object({ note: z.unknown().optional() });

/**
 * DELETE /api/players/[id]/collections/[slug]/items/[gameId] — Retirer un jeu d'une collection.
 * Authentification requise. Seul le propriétaire peut retirer des jeux.
 * Réordonne automatiquement les positions restantes.
 */
export const DELETE = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const { id: playerId, slug, gameId } = params;

  if (!playerId || !slug || !gameId) {
    throw validationError(undefined, "Player ID, slug, and game ID are required");
  }

  if (user.id !== playerId) {
    throw forbidden("Forbidden");
  }

  await removeItem(user.id, slug, gameId);

  return new NextResponse(null, { status: 204 });
});

/**
 * PATCH /api/players/[id]/collections/[slug]/items/[gameId] — Modifier la note d'un jeu.
 * Authentification requise. Seul le propriétaire peut modifier la note.
 */
export const PATCH = defineRoute(
  {
    auth: "required",
    rateLimit: "collectionItem",
    writesContent: true,
    body: updateNoteSchema,
  },
  async ({ user, params, body }) => {
    const { id: playerId, slug, gameId } = params;

    if (!playerId || !slug || !gameId) {
      throw validationError(undefined, "Player ID, slug, and game ID are required");
    }

    const rawNote = body.note;

    if (rawNote !== null && rawNote !== undefined && typeof rawNote !== "string") {
      throw validationError(undefined, "Note must be a string or null");
    }

    const note = typeof rawNote === "string" ? rawNote : null;
    if (note && note.length > NOTE_MAX_LENGTH) {
      throw validationError(undefined, `Note must be at most ${NOTE_MAX_LENGTH} characters`);
    }

    if (user.id !== playerId) {
      throw forbidden("Forbidden");
    }

    await updateItemNote(user.id, slug, gameId, note);

    return new NextResponse(null, { status: 204 });
  }
);
