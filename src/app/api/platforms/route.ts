import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";

    const supabase = await createRouteHandlerClient();

    // Fetch all platforms with translations for the requested locale
    const { data: platforms, error: platformsError } = await supabase
      .from("platforms")
      .select(
        `
        id,
        slug,
        icon_url,
        created_at,
        platform_translations!inner(
          name,
          abbreviation
        )
      `
      )
      .eq("platform_translations.language_code", locale);

    if (platformsError) {
      logger.error("Error fetching platforms", { error: platformsError });

      // Fallback to English if locale not found
      if (locale !== "en") {
        const { data: fallbackPlatforms, error: fallbackError } = await supabase
          .from("platforms")
          .select(
            `
            id,
            slug,
            icon_url,
            created_at,
            platform_translations!inner(
              name,
              abbreviation
            )
          `
          )
          .eq("platform_translations.language_code", "en");

        if (fallbackError || !fallbackPlatforms) {
          return NextResponse.json({ error: "Failed to fetch platforms" }, { status: 500 });
        }

        return buildResponse(supabase, fallbackPlatforms, locale);
      }

      return NextResponse.json({ error: "Failed to fetch platforms" }, { status: 500 });
    }

    if (!platforms || platforms.length === 0) {
      // Fallback to English if no translations found for requested locale
      if (locale !== "en") {
        const { data: fallbackPlatforms, error: fallbackError } = await supabase
          .from("platforms")
          .select(
            `
            id,
            slug,
            icon_url,
            created_at,
            platform_translations!inner(
              name,
              abbreviation
            )
          `
          )
          .eq("platform_translations.language_code", "en");

        if (!fallbackError && fallbackPlatforms && fallbackPlatforms.length > 0) {
          return buildResponse(supabase, fallbackPlatforms, locale);
        }
      }
      return NextResponse.json({ platforms: [], locale });
    }

    return buildResponse(supabase, platforms, locale);
  } catch (error) {
    logger.error("Error in platforms API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildResponse(supabase: any, platforms: any[], locale: string) {
  // Fetch game counts for all platforms
  const { data: gameCounts, error: countsError } = await supabase
    .from("game_platforms")
    .select("platform_id");

  if (countsError) {
    logger.error("Error fetching platform game counts", { error: countsError });
  }

  const countsByPlatform: Record<string, number> = {};
  if (gameCounts) {
    gameCounts.forEach((item: { platform_id: string }) => {
      countsByPlatform[item.platform_id] = (countsByPlatform[item.platform_id] || 0) + 1;
    });
  }

  interface PlatformRow {
    id: string;
    slug: string;
    icon_url: string | null;
    created_at: string | null;
    platform_translations?: Array<{
      name: string;
      abbreviation?: string | null;
    }>;
  }

  const transformedPlatforms = (platforms as PlatformRow[]).map((platform) => {
    const translation = platform.platform_translations?.[0];
    return {
      id: platform.id,
      slug: platform.slug,
      name: translation?.name || platform.slug,
      abbreviation: translation?.abbreviation || null,
      iconUrl: platform.icon_url,
      gameCount: countsByPlatform[platform.id] || 0,
    };
  });

  transformedPlatforms.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ platforms: transformedPlatforms, locale });
}
