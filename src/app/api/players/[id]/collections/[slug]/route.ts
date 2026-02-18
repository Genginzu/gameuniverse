import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  fetchCollectionDetail,
  updateCollection,
  deleteCollection,
} from "@/lib/services/collectionService";
import { updateCollectionSchema } from "@/lib/validations/collection";

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

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error in players/[id]/collections/[slug] GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/players/[id]/collections/[slug] — Modifier une collection.
 * Authentification requise. Seul le propriétaire peut modifier.
 * Le slug n'est pas modifié.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, slug } = await params;

    if (!playerId || !slug) {
      return NextResponse.json({ error: "Player ID and slug are required" }, { status: 400 });
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

    const body = await request.json();
    const parsed = updateCollectionSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const result = await updateCollection(user.id, slug, parsed.data);

    return NextResponse.json({ collection: result });
  } catch (error) {
    console.error("Error in players/[id]/collections/[slug] PATCH:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/players/[id]/collections/[slug] — Supprimer une collection.
 * Authentification requise. Seul le propriétaire peut supprimer.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId, slug } = await params;

    if (!playerId || !slug) {
      return NextResponse.json({ error: "Player ID and slug are required" }, { status: 400 });
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

    await deleteCollection(user.id, slug);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error in players/[id]/collections/[slug] DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
