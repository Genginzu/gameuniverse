import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { addItem } from "@/lib/services/collectionService";
import { addCollectionItemSchema } from "@/lib/validations/collection";

type RouteContext = { params: Promise<{ id: string; slug: string }> };

/**
 * POST /api/players/[id]/collections/[slug]/items — Ajouter un jeu à une collection.
 * Authentification requise. Seul le propriétaire peut ajouter des jeux.
 * Retourne 409 si le jeu est déjà présent (contrainte UNIQUE).
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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
    const parsed = addCollectionItemSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    await addItem(user.id, slug, parsed.data);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation (duplicate game in collection)
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Ce jeu est déjà dans la collection" }, { status: 409 });
    }

    console.error("Error in players/[id]/collections/[slug]/items POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
