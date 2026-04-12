import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";
import { logger } from "@/lib/logger";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

/**
 * POST /api/admin/global-sync/colors
 * Extracts colors from cover images for enriched games.
 * One at a time since color extraction is CPU/network heavy.
 */
export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entry, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, cover_image_id, matched_game_id")
      .eq("is_synced", true)
      .eq("is_colors_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !entry) {
      const { count } = await supabase
        .from("igdb_global_sync")
        .select("id", { count: "exact", head: true })
        .eq("is_synced", true)
        .eq("is_colors_synced", false)
        .not("matched_game_id", "is", null);

      if ((count ?? 0) === 0) {
        return NextResponse.json({ done: true, remaining: 0 });
      }
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const result = await extractColors(supabase, entry);

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_colors_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ ...result, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync colors", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface ColorEntry {
  id: number;
  igdb_id: number;
  name: string;
  cover_image_id: string | null;
  matched_game_id: string;
}

interface ColorResult {
  success: boolean;
  igdbId: number;
  name: string;
  hasColors: boolean;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractColors(supabase: any, entry: ColorEntry): Promise<ColorResult> {
  const base = { igdbId: entry.igdb_id, name: entry.name };
  try {
    if (!entry.cover_image_id) {
      await supabase.from("igdb_global_sync").update({ is_colors_synced: true }).eq("id", entry.id);
      return { ...base, success: true, hasColors: false };
    }

    const coverUrl = `${IGDB_IMAGE_BASE}/t_cover_big/${entry.cover_image_id}.jpg`;
    const colors = await extractColorsFromCover(coverUrl);

    if (colors) {
      await supabase
        .from("games")
        .update({
          background_color: colors.background_color,
          accent_color: colors.accent_color,
          label_color: colors.label_color,
          text_color: colors.text_color,
        })
        .eq("id", entry.matched_game_id);
    }

    await supabase.from("igdb_global_sync").update({ is_colors_synced: true }).eq("id", entry.id);
    return { ...base, success: true, hasColors: !!colors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.warn("Color extraction failed", { igdbId: entry.igdb_id, error: msg });
    return { ...base, success: false, hasColors: false, error: msg };
  }
}
