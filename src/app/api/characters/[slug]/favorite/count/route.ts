import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CharacterFavoriteService } from "@/lib/services/characterFavoriteService";

type RouteContext = { params: Promise<{ slug: string }> };

// characters table is not yet in the generated Supabase types
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

// GET /api/characters/[slug]/favorite/count — Compteur public de favoris
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createRouteHandlerClient();
    const { slug } = await params;

    const characterId = await resolveCharacterId(supabase, slug);

    if (!characterId) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const count = await CharacterFavoriteService.getFavoriteCount(characterId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in favorite count GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
