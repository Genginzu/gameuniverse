import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 200;

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { data: entries, error: fetchError } = await supabase
      .from("igdb_global_sync")
      .select("id, igdb_id, name, matched_game_id")
      .eq("is_synced", true)
      .eq("is_languages_synced", false)
      .not("matched_game_id", "is", null)
      .order("igdb_id", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error("Error fetching for languages sync", { fetchError });
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
    if (!entries || entries.length === 0) {
      return NextResponse.json({ results: [], done: true, remaining: 0 });
    }

    const igdbIds = entries.map((e) => e.igdb_id);
    const igdbMap = await IGDBService.getLanguagesBatch(igdbIds);

    // Bulk delete all game_languages for these games
    const gameIds = entries.map((e) => e.matched_game_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("game_languages").delete().in("game_id", gameIds);

    // Collect all supported_languages upserts and game_languages inserts
    const supportedLangsMap = new Map<string, { name: string; native_name: string }>();
    const allGameLangRows: Array<Record<string, unknown>> = [];

    for (const entry of entries) {
      const igdbGame = igdbMap.get(entry.igdb_id);
      if (!igdbGame?.language_supports?.length) continue;

      // Aggregate supports per language for this game
      const languageMap = new Map<
        string,
        { name: string; nativeName: string; hasAudio: boolean; hasSubtitles: boolean; hasInterface: boolean }
      >();

      for (const ls of igdbGame.language_supports) {
        if (!ls.language?.locale) continue;
        const langCode = ls.language.locale.split("-")[0].toLowerCase();
        const existing = languageMap.get(langCode) || {
          name: ls.language.name || langCode,
          nativeName: ls.language.native_name || langCode,
          hasAudio: false,
          hasSubtitles: false,
          hasInterface: false,
        };

        const supportType = ls.language_support_type?.name?.toLowerCase() || "";
        if (supportType.includes("audio")) existing.hasAudio = true;
        else if (supportType.includes("subtitle")) existing.hasSubtitles = true;
        else if (supportType.includes("interface")) existing.hasInterface = true;

        languageMap.set(langCode, existing);
      }

      for (const [code, lang] of languageMap) {
        supportedLangsMap.set(code, { name: lang.name, native_name: lang.nativeName });
        allGameLangRows.push({
          game_id: entry.matched_game_id,
          language_code: code,
          language_name: lang.name,
          has_audio: lang.hasAudio,
          has_subtitles: lang.hasSubtitles,
          has_interface: lang.hasInterface,
        });
      }
    }

    // Bulk upsert supported_languages
    if (supportedLangsMap.size > 0) {
      const supportedRows = Array.from(supportedLangsMap, ([code, v]) => ({
        code,
        name: v.name,
        native_name: v.native_name,
      }));
      await supabase
        .from("supported_languages")
        .upsert(supportedRows, { onConflict: "code", ignoreDuplicates: true });
    }

    // Bulk insert game_languages
    if (allGameLangRows.length > 0) {
      await supabase.from("game_languages").insert(allGameLangRows);
    }

    // Bulk update sync flags
    const syncIds = entries.map((e) => e.id);
    await supabase.from("igdb_global_sync").update({ is_languages_synced: true }).in("id", syncIds);

    const results = entries.map((e) => ({ igdbId: e.igdb_id, name: e.name, success: true }));

    const { count: remaining } = await supabase
      .from("igdb_global_sync")
      .select("id", { count: "exact", head: true })
      .eq("is_synced", true)
      .eq("is_languages_synced", false)
      .not("matched_game_id", "is", null);

    return NextResponse.json({ results, done: false, remaining: remaining ?? 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in global-sync languages", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
