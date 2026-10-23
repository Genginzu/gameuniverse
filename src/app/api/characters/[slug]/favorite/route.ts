import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CharacterFavoriteService } from "@/lib/services/characterFavoriteService";
import { logger } from "@/lib/logger";
import { rewardActivity } from "@/lib/services/activityRewards";
import { conflict, defineRoute, notFound } from "@/lib/api/route";

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
export const POST = defineRoute(
  { auth: "required", rateLimit: "favorite" },
  async ({ user, params }) => {
    const supabase = await createRouteHandlerClient();
    const characterId = await resolveCharacterId(supabase, params.slug);

    if (!characterId) {
      throw notFound("Character not found");
    }

    try {
      await CharacterFavoriteService.addFavorite(characterId, user.id);
    } catch (error: unknown) {
      if ((error as { code?: string }).code === "23505") {
        throw conflict("Already favorited");
      }
      throw error;
    }

    await rewardActivity({ kind: "character_favorited", userId: user.id, characterId });

    return NextResponse.json({ success: true });
  }
);

// DELETE /api/characters/[slug]/favorite — Retirer des favoris
export const DELETE = defineRoute(
  { auth: "required", rateLimit: "favorite" },
  async ({ user, params }) => {
    const supabase = await createRouteHandlerClient();
    const characterId = await resolveCharacterId(supabase, params.slug);

    if (!characterId) {
      throw notFound("Character not found");
    }

    await CharacterFavoriteService.removeFavorite(characterId, user.id);

    return NextResponse.json({ success: true });
  }
);

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
    logger.error("Error in favorite GET API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
