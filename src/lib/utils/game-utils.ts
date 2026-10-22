/**
 * Game Utilities
 *
 * Shared utility functions for game-related operations including
 * color scheme generation, date formatting, price formatting, and metascore colors.
 *
 * @module game-utils
 */

import { BRAND_COLORS } from "@/lib/utils/brand-colors";

/**
 * Color scheme for game UI elements
 */
export interface GameColors {
  /** Primary accent color (CSS color value) */
  primary: string;
  /** Secondary accent color (CSS color value) */
  secondary: string;
  /** Highlight/accent color (CSS color value) */
  accent: string;
  /** Background gradient class (Tailwind gradient) */
  bg: string;
  /** Page background color (CSS hex) */
  backgroundColor: string;
  /** Label/small text color (CSS hex) */
  labelColor: string;
  /** Main text color (CSS hex) */
  textColor: string;
}

/** Default colors when no custom color is set */
const DEFAULT_COLORS = {
  backgroundColor: BRAND_COLORS.neutral[950],
  accent: BRAND_COLORS.primary[500],
  labelColor: BRAND_COLORS.neutral[400],
  textColor: BRAND_COLORS.neutral[200],
} as const;

/**
 * Builds a GameColors object from DB-stored colors with sensible defaults.
 * Replaces the old title-based getGameColors() approach.
 */
export function buildGameColors(opts: {
  accentColor?: string | null;
  backgroundColor?: string | null;
  labelColor?: string | null;
  textColor?: string | null;
}): GameColors {
  const accent = opts.accentColor || DEFAULT_COLORS.accent;
  return {
    primary: accent,
    secondary: accent,
    accent,
    bg: "",
    backgroundColor: opts.backgroundColor || DEFAULT_COLORS.backgroundColor,
    labelColor: opts.labelColor || DEFAULT_COLORS.labelColor,
    textColor: opts.textColor || DEFAULT_COLORS.textColor,
  };
}
/**
 * Generates a color scheme based on game title and genres.
 * Uses title-based matching for known games, with a default violet theme.
 *
 * **Validates: Requirements 14.6**
 *
 * @param gameTitle - The title of the game
 * @param _genres - Array of genre names (reserved for future use)
 * @returns GameColors object with primary, secondary, accent, and bg properties
 *
 * @example
 * ```ts
 * const colors = getGameColors("The Witcher 3", ["RPG", "Action"]);
 * // Returns amber color scheme
 * ```
 */
export function getGameColors(gameTitle: string, _genres: string[]): GameColors {
  const title = gameTitle.toLowerCase();

  if (title.includes("witcher")) {
    return {
      primary: "#f59e0b", // amber-500
      secondary: "#d97706", // amber-600
      accent: "#fbbf24", // amber-400
      bg: "from-amber-500/10 to-orange-500/10",
      backgroundColor: DEFAULT_COLORS.backgroundColor,
      labelColor: DEFAULT_COLORS.labelColor,
      textColor: DEFAULT_COLORS.textColor,
    };
  }

  if (title.includes("cyberpunk")) {
    return {
      primary: BRAND_COLORS.secondary[500],
      secondary: BRAND_COLORS.primary[500],
      accent: BRAND_COLORS.secondary[400],
      bg: "from-palette-secondary-500/10 to-palette-primary-500/10",
      backgroundColor: DEFAULT_COLORS.backgroundColor,
      labelColor: DEFAULT_COLORS.labelColor,
      textColor: DEFAULT_COLORS.textColor,
    };
  }

  if (title.includes("minecraft")) {
    return {
      primary: "#10b981", // emerald-500
      secondary: "#059669", // emerald-600
      accent: "#34d399", // emerald-400
      bg: "from-emerald-500/10 to-green-500/10",
      backgroundColor: DEFAULT_COLORS.backgroundColor,
      labelColor: DEFAULT_COLORS.labelColor,
      textColor: DEFAULT_COLORS.textColor,
    };
  }

  // Default color scheme
  return {
    primary: BRAND_COLORS.primary[500],
    secondary: BRAND_COLORS.primary[600],
    accent: BRAND_COLORS.primary[400],
    bg: "from-palette-primary-500/10 to-palette-secondary-500/10",
    backgroundColor: DEFAULT_COLORS.backgroundColor,
    labelColor: DEFAULT_COLORS.labelColor,
    textColor: DEFAULT_COLORS.textColor,
  };
}

/**
 * Formats a release date string according to the specified locale.
 *
 * **Validates: Requirements 14.7**
 *
 * @param dateString - ISO date string or undefined
 * @param locale - Locale code for formatting (e.g., "en", "fr")
 * @returns Formatted date string or null if dateString is undefined
 *
 * @example
 * ```ts
 * formatReleaseDate("2023-05-15", "en");
 * // Returns "May 15, 2023"
 *
 * formatReleaseDate("2023-05-15", "fr");
 * // Returns "15 mai 2023"
 * ```
 */
export function formatReleaseDate(dateString: string | undefined, locale: string): string | null {
  if (!dateString || dateString === "1970-01-01") return null;

  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Formats a price value with currency symbol according to locale.
 *
 * **Validates: Requirements 14.7**
 *
 * @param price - Numeric price value
 * @param currency - ISO 4217 currency code (e.g., "USD", "EUR")
 * @param locale - Locale code for formatting (e.g., "en-US", "fr-FR")
 * @returns Formatted currency string
 *
 * @example
 * ```ts
 * formatPrice(59.99, "USD", "en-US");
 * // Returns "$59.99"
 *
 * formatPrice(59.99, "EUR", "fr-FR");
 * // Returns "59,99 €"
 * ```
 */
export function formatPrice(price: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(price);
}

/**
 * Returns the appropriate Tailwind CSS background color class for a metascore.
 *
 * Score ranges:
 * - 90+: green-600 (exceptional)
 * - 75-89: green-500 (excellent)
 * - 60-74: yellow-500 (good)
 * - 40-59: orange-500 (average)
 * - Below 40: red-500 (poor)
 * - No score: gray-500
 *
 * **Validates: Requirements 14.7**
 *
 * @param score - Metascore value (0-100) or undefined
 * @returns Tailwind CSS background color class
 *
 * @example
 * ```ts
 * getMetascoreColor(92);  // Returns "bg-green-600"
 * getMetascoreColor(75);  // Returns "bg-green-500"
 * getMetascoreColor(65);  // Returns "bg-yellow-500"
 * getMetascoreColor(45);  // Returns "bg-orange-500"
 * getMetascoreColor(30);  // Returns "bg-red-500"
 * getMetascoreColor();    // Returns "bg-gray-500"
 * ```
 */
export function getMetascoreColor(score?: number): string {
  if (!score) return "bg-gray-500";
  if (score >= 90) return "bg-green-600";
  if (score >= 75) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}
