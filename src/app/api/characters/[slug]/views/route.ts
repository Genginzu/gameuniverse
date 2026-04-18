import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Character tables are not yet in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Resolve slug to character ID
    const { data: character, error: fetchError } = await db
      .from("characters")
      .select("id")
      .eq("slug", slug)
      .single();

    if (fetchError || !character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Increment view count atomically via RPC
    const { error } = await db.rpc("increment_character_view_count", {
      p_character_id: character.id,
    });

    if (error) {
      logger.error("Error incrementing character view count", { slug, error });
      return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in character views API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
