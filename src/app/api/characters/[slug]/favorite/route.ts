import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CharacterFavoriteService } from "@/lib/services/characterFavoriteService";

type RouteContext = { params: Promise<{ slug: string }> };

// characters and character_favorites tables are not yet in the generated
// Supabase types (migration applied but types not regenerated).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * Resolve a character slug to its UUID.
 * Returns null if the character does not exist.
 */
async function resolveCharacterId(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("characters" as UntypedFrom)
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return (data as unknown as { id: string }).id;
}

// POST /api/characters/[slug]/favorite — Ajouter aux favoris
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const characterId = await resolveCharacterId(supabase, slug);

    if (!characterId) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    await CharacterFavoriteService.addFavorite(characterId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json({ error: "Already favorited" }, { status: 409 });
    }
    console.error("Error in favorite POST API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/characters/[slug]/favorite — Retirer des favoris
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const characterId = await resolveCharacterId(supabase, slug);

    if (!characterId) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    await CharacterFavoriteService.removeFavorite(characterId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in favorite DELETE API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/characters/[slug]/favorite — Statut du favori pour l'utilisateur courant
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const characterId = await resolveCharacterId(supabase, slug);

    if (!characterId) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Query directly to get both the existence check and the created_at date
    const { data, error } = await supabase
      .from("character_favorites" as UntypedFrom)
      .select("created_at")
      .eq("user_id", user.id)
      .eq("character_id", characterId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned (not favorited)
      if (error.code === "PGRST205") {
        return NextResponse.json({ isFavorite: false });
      }
      throw error;
    }

    if (data) {
      return NextResponse.json({
        isFavorite: true,
        favoritedAt: (data as unknown as { created_at: string }).created_at,
      });
    }

    return NextResponse.json({ isFavorite: false });
  } catch (error) {
    console.error("Error in favorite GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
