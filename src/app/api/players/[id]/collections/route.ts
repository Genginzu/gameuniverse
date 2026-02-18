import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { fetchCollections, createCollection } from "@/lib/services/collectionService";
import { createCollectionSchema } from "@/lib/validations/collection";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/players/[id]/collections — Liste les collections d'un joueur.
 * Propriétaire : toutes ses collections (publiques + privées).
 * Autre utilisateur : collections publiques uniquement.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const collections = await fetchCollections(playerId, user?.id, locale);

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Error in players/[id]/collections GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/players/[id]/collections — Crée une nouvelle collection.
 * Authentification requise. Seul le propriétaire (user.id === playerId) peut créer.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: playerId } = await params;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
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
    const parsed = createCollectionSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    const result = await createCollection(user.id, parsed.data);

    return NextResponse.json({ collection: result }, { status: 201 });
  } catch (error) {
    console.error("Error in players/[id]/collections POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
