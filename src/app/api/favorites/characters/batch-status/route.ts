import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, validationError } from "@/lib/api/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

// The array check stays in the handler so the dedicated 400 message is unchanged.
const batchStatusSchema = z.object({ slugs: z.any().optional() });

/**
 * POST /api/favorites/characters/batch-status
 * Check favorite status for multiple character slugs at once.
 * Body: { slugs: string[] }
 * Returns: { statuses: Record<string, boolean> } (slug → isFavorite)
 */
export const POST = defineRoute(
  { auth: "required", body: batchStatusSchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { slugs } = body;

    if (!Array.isArray(slugs) || slugs.length === 0) {
      throw validationError(undefined, "slugs array is required");
    }

    const limitedSlugs = slugs.slice(0, 100);

    // Resolve slugs → IDs
    const { data: characters, error: charError } = await supabase
      .from("characters" as UntypedFrom)
      .select("id, slug")
      .in("slug", limitedSlugs);

    if (charError) {
      if (charError.code === "PGRST205") {
        return NextResponse.json({ statuses: {} });
      }
      throw charError;
    }

    const charRows = (characters ?? []) as unknown as { id: string; slug: string }[];
    if (charRows.length === 0) {
      const statuses: Record<string, boolean> = {};
      for (const s of limitedSlugs) statuses[s] = false;
      return NextResponse.json({ statuses });
    }

    const charIds = charRows.map((c) => c.id);

    // Batch query favorites
    const { data: favData, error: favError } = await supabase
      .from("character_favorites" as UntypedFrom)
      .select("character_id")
      .eq("user_id", user.id)
      .in("character_id", charIds);

    if (favError) {
      if (favError.code === "PGRST205") {
        return NextResponse.json({ statuses: {} });
      }
      throw favError;
    }

    const favSet = new Set(
      ((favData ?? []) as unknown as { character_id: string }[]).map((r) => r.character_id)
    );

    const statuses: Record<string, boolean> = {};
    for (const slug of limitedSlugs) {
      const row = charRows.find((c) => c.slug === slug);
      statuses[slug] = row ? favSet.has(row.id) : false;
    }

    return NextResponse.json({ statuses });
  }
);
