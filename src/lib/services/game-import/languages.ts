import { IGDBGame } from "@/types/igdb";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

/**
 * Creates language support entries for a game.
 */
export async function createLanguages(gameId: string, igdbGame: IGDBGame): Promise<void> {
  if (!igdbGame.language_supports || igdbGame.language_supports.length === 0) {
    return;
  }

  const supabase = await createRouteHandlerClient();

  // Group language supports by language to consolidate audio/subtitles/interface
  const languageMap = new Map<
    string,
    {
      name: string;
      nativeName: string;
      code: string;
      hasAudio: boolean;
      hasSubtitles: boolean;
      hasInterface: boolean;
    }
  >();

  for (const ls of igdbGame.language_supports) {
    if (!ls.language?.locale) continue;

    const langCode = ls.language.locale.split("-")[0].toLowerCase();
    const langName = ls.language.name || ls.language.native_name || langCode;
    const langNativeName = ls.language.native_name || ls.language.name || langCode;

    const existing = languageMap.get(langCode) || {
      name: langName,
      nativeName: langNativeName,
      code: langCode,
      hasAudio: false,
      hasSubtitles: false,
      hasInterface: false,
    };

    const supportType = ls.language_support_type?.name?.toLowerCase() || "";
    if (supportType.includes("audio")) {
      existing.hasAudio = true;
    } else if (supportType.includes("subtitle")) {
      existing.hasSubtitles = true;
    } else if (supportType.includes("interface")) {
      existing.hasInterface = true;
    }

    languageMap.set(langCode, existing);
  }

  const langs = Array.from(languageMap.values());

  if (langs.length > 0) {
    const supportedRows = langs.map((l) => ({
      code: l.code,
      name: l.name,
      native_name: l.nativeName,
    }));

    const { error: upsertErr } = await supabase
      .from("supported_languages")
      .upsert(supportedRows, { onConflict: "code", ignoreDuplicates: true });
    if (upsertErr) {
      logger.warn("Failed to upsert supported_languages", { error: upsertErr });
    }

    const codes = langs.map((l) => l.code);
    const { data: supportedLangs } = await supabase
      .from("supported_languages")
      .select("code, name")
      .in("code", codes);

    const nameMap = new Map((supportedLangs ?? []).map((sl) => [sl.code, sl.name]));

    const languageEntries = langs.map((lang) => ({
      game_id: gameId,
      language_code: lang.code,
      language_name: nameMap.get(lang.code) ?? lang.name,
      has_audio: lang.hasAudio,
      has_subtitles: lang.hasSubtitles,
      has_interface: lang.hasInterface,
    }));

    const { error } = await supabase.from("game_languages").insert(languageEntries);
    if (error) {
      logger.error("Failed to insert game languages", { gameId, error });
    }
  }
}

/**
 * Updates language support entries for an existing game.
 */
export async function updateLanguages(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = await createRouteHandlerClient();

  await supabase.from("game_languages").delete().eq("game_id", gameId);
  await createLanguages(gameId, igdbGame);
}
