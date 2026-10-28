import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { fetchGameFilterCounts } from "@/lib/services/gameFilterCounts";

const FALLBACK_LOCALE = "en";

interface PlatformTranslationRow {
  name: string;
  abbreviation?: string | null;
  language_code: string;
}

interface PlatformRow {
  id: string;
  slug: string;
  icon_url: string | null;
  platform_translations?: PlatformTranslationRow[];
}

/**
 * Translation in the requested locale, else English. Importers only write the
 * English row, so filtering on the locale with `!inner` dropped most platforms.
 */
function pickTranslation(platform: PlatformRow, locale: string) {
  const translations = platform.platform_translations ?? [];
  return (
    translations.find((row) => row.language_code === locale) ??
    translations.find((row) => row.language_code === FALLBACK_LOCALE)
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    const [{ data: platforms, error: platformsError }, counts] = await Promise.all([
      supabase
        .from("platforms")
        .select("id, slug, icon_url, platform_translations(name, abbreviation, language_code)")
        .in("platform_translations.language_code", [locale, FALLBACK_LOCALE]),
      fetchGameFilterCounts(supabase),
    ]);

    if (platformsError) {
      logger.error("Error fetching platforms", { error: platformsError });
      return NextResponse.json({ error: "Failed to fetch platforms" }, { status: 500 });
    }

    const transformedPlatforms = ((platforms ?? []) as PlatformRow[]).map((platform) => {
      const translation = pickTranslation(platform, locale);
      return {
        id: platform.id,
        slug: platform.slug,
        name: translation?.name || platform.slug,
        abbreviation: translation?.abbreviation || null,
        iconUrl: platform.icon_url,
        gameCount: counts.platform.get(platform.id) ?? 0,
      };
    });

    transformedPlatforms.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ platforms: transformedPlatforms, locale });
  } catch (error) {
    logger.error("Error in platforms API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
