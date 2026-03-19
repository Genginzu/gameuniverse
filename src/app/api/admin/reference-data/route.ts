import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  getAvailableCompanies,
  getAvailableContentDescriptors,
  getAvailableGamePlatforms,
  getAvailableGenres,
  getAvailableRatings,
  getAvailableStores,
  getAvailableSupportedLanguages,
  getGameStatistics,
} from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/reference-data - Get reference data for admin forms
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const include = searchParams.get("include")?.split(",") || ["all"];

    const referenceData: Record<string, unknown> = {};

    // Get companies if requested
    if (include.includes("all") || include.includes("companies")) {
      referenceData.companies = await getAvailableCompanies();
    }

    // Get genres if requested
    if (include.includes("all") || include.includes("genres")) {
      referenceData.genres = await getAvailableGenres(locale);
    }

    // Get stores if requested
    if (include.includes("all") || include.includes("stores")) {
      referenceData.stores = await getAvailableStores();
    }

    // Get ratings if requested
    if (include.includes("all") || include.includes("ratings")) {
      referenceData.ratings = await getAvailableRatings();
    }

    // Get content descriptors if requested
    if (include.includes("all") || include.includes("contentDescriptors")) {
      referenceData.contentDescriptors = await getAvailableContentDescriptors(locale);
    }

    // Get statistics if requested
    if (include.includes("all") || include.includes("statistics")) {
      referenceData.statistics = await getGameStatistics();
    }

    // Get supported languages for game language assignment
    if (include.includes("all") || include.includes("supportedLanguages")) {
      referenceData.supportedLanguages = await getAvailableSupportedLanguages();
    }

    // Get app languages (for translations)
    if (include.includes("all") || include.includes("languages")) {
      referenceData.languages = [
        { code: "fr", name: "Français", nativeName: "Français", isDefault: true },
        { code: "en", name: "English", nativeName: "English", isDefault: false },
      ];
    }

    // Get supported currencies
    if (include.includes("all") || include.includes("currencies")) {
      referenceData.currencies = [
        { code: "EUR", name: "Euro", symbol: "€" },
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "GBP", name: "British Pound", symbol: "£" },
        { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
      ];
    }

    // Get supported platforms (from DB)
    if (include.includes("all") || include.includes("platforms")) {
      referenceData.platforms = [
        "PC",
        "PlayStation 5",
        "PlayStation 4",
        "Xbox Series X/S",
        "Xbox One",
        "Nintendo Switch",
        "iOS",
        "Android",
        "Mac",
        "Linux",
      ];
    }

    // Get game platforms (from platforms table)
    if (include.includes("all") || include.includes("gamePlatforms")) {
      referenceData.gamePlatforms = await getAvailableGamePlatforms(locale);
    }

    // Get media types
    if (include.includes("all") || include.includes("mediaTypes")) {
      referenceData.mediaTypes = {
        artwork: ["concept", "promotional", "wallpaper", "character", "environment"],
        video: ["trailer", "gameplay", "cutscene", "developer_diary", "review"],
      };
    }

    return NextResponse.json({
      data: referenceData,
      locale,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in admin reference-data GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
