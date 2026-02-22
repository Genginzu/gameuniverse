import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { reorderItems } from "@/lib/services/collectionService";
import { reorderCollectionItemsSchema } from "@/lib/validations/collection";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string; slug: string }> };

/**
 * PATCH /api/players/[id]/collections/[slug]/items/reorder — Réordonner les jeux d'une collection.
 * Authentification requise. Seul le propriétaire peut réordonner les jeux.
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
    const parsed = reorderCollectionItemsSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    await reorderItems(user.id, slug, parsed.data.items);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("Error in collection items reorder PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
