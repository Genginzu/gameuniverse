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

const STATIC_LANGUAGES = [
  { code: "fr", name: "Français", nativeName: "Français", isDefault: true },
  { code: "en", name: "English", nativeName: "English", isDefault: false },
];

const STATIC_CURRENCIES = [
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
];

const STATIC_PLATFORMS = [
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

const STATIC_MEDIA_TYPES = {
  artwork: ["concept", "promotional", "wallpaper", "character", "environment"],
  video: ["trailer", "gameplay", "cutscene", "developer_diary", "review"],
};

/**
 * GET /api/admin/reference-data - Get reference data for admin forms
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "fr";
    const include = searchParams.get("include")?.split(",") || ["all"];

    const wants = (key: string) => include.includes("all") || include.includes(key);

    // Fire all DB-backed fetches in parallel; static data resolves immediately
    const [
      companies,
      genres,
      stores,
      ratings,
      contentDescriptors,
      statistics,
      supportedLanguages,
      gamePlatforms,
    ] = await Promise.all([
      wants("companies") ? getAvailableCompanies() : undefined,
      wants("genres") ? getAvailableGenres(locale) : undefined,
      wants("stores") ? getAvailableStores() : undefined,
      wants("ratings") ? getAvailableRatings() : undefined,
      wants("contentDescriptors") ? getAvailableContentDescriptors(locale) : undefined,
      wants("statistics") ? getGameStatistics() : undefined,
      wants("supportedLanguages") ? getAvailableSupportedLanguages() : undefined,
      wants("gamePlatforms") ? getAvailableGamePlatforms(locale) : undefined,
    ]);

    const referenceData: Record<string, unknown> = {};
    if (companies !== undefined) referenceData.companies = companies;
    if (genres !== undefined) referenceData.genres = genres;
    if (stores !== undefined) referenceData.stores = stores;
    if (ratings !== undefined) referenceData.ratings = ratings;
    if (contentDescriptors !== undefined) referenceData.contentDescriptors = contentDescriptors;
    if (statistics !== undefined) referenceData.statistics = statistics;
    if (supportedLanguages !== undefined) referenceData.supportedLanguages = supportedLanguages;
    if (gamePlatforms !== undefined) referenceData.gamePlatforms = gamePlatforms;
    if (wants("languages")) referenceData.languages = STATIC_LANGUAGES;
    if (wants("currencies")) referenceData.currencies = STATIC_CURRENCIES;
    if (wants("platforms")) referenceData.platforms = STATIC_PLATFORMS;
    if (wants("mediaTypes")) referenceData.mediaTypes = STATIC_MEDIA_TYPES;

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
