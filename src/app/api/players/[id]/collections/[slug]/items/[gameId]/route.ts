import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { removeItem, updateItemNote } from "@/lib/services/collectionService";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string; slug: string; gameId: string }> };

const NOTE_MAX_LENGTH = 250;

/**
 * DELETE /api/players/[id]/collections/[slug]/items/[gameId] — Retirer un jeu d'une collection.
 * Authentification requise. Seul le propriétaire peut retirer des jeux.
 * Réordonne automatiquement les positions restantes.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, slug, gameId } = await params;

    if (!playerId || !slug || !gameId) {
      return NextResponse.json(
        { error: "Player ID, slug, and game ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await removeItem(user.id, slug, gameId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in collection item DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/players/[id]/collections/[slug]/items/[gameId] — Modifier la note d'un jeu.
 * Authentification requise. Seul le propriétaire peut modifier la note.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, slug, gameId } = await params;

    if (!playerId || !slug || !gameId) {
      return NextResponse.json(
        { error: "Player ID, slug, and game ID are required" },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { note?: unknown };
    const rawNote = body.note;

    if (rawNote !== null && rawNote !== undefined && typeof rawNote !== "string") {
      return NextResponse.json({ error: "Note must be a string or null" }, { status: 400 });
    }

    const note = typeof rawNote === "string" ? rawNote : null;
    if (note && note.length > NOTE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Note must be at most ${NOTE_MAX_LENGTH} characters` },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== playerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await updateItemNote(user.id, slug, gameId, note);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in collection item PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
