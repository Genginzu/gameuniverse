/**
 * Utilities for esport-related UI helpers (flags, role colors, game icons).
 * Pure functions, no React or DOM dependencies.
 */

/**
 * Convert a 2-letter ISO country code (e.g. "FR", "us") into the corresponding
 * regional indicator emoji (🇫🇷, 🇺🇸). Returns null when input is invalid.
 *
 * PandaScore returns nationalities as ISO 3166-1 alpha-2 codes.
 */
export function countryCodeToFlag(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;

  const base = 0x1f1e6; // Regional Indicator Symbol Letter A
  const aCharCode = "A".charCodeAt(0);
  const first = base + (trimmed.charCodeAt(0) - aCharCode);
  const second = base + (trimmed.charCodeAt(1) - aCharCode);
  return String.fromCodePoint(first, second);
}

/**
 * Iconify icon name for a given videogame slug or name.
 * Falls back to a generic gamepad icon.
 */
export function getGameIcon(gameSlugOrName: string | null | undefined): string {
  if (!gameSlugOrName) return "mdi:gamepad-variant";
  const value = gameSlugOrName.toLowerCase();

  if (value.includes("rocket")) return "simple-icons:rocketleague";
  if (value.includes("league") || value.includes("lol")) return "simple-icons:leagueoflegends";
  if (value.includes("valorant")) return "simple-icons:valorant";
  if (value.includes("counter") || value.includes("cs")) return "simple-icons:counterstrike";
  if (value.includes("dota")) return "simple-icons:dota2";
  if (value.includes("rainbow")) return "mdi:shield-crown";
  if (value.includes("overwatch")) return "simple-icons:battledotnet";
  if (value.includes("call-of-duty") || value.includes("cod")) return "mdi:target";
  if (value.includes("starcraft")) return "mdi:rocket-launch";
  if (value.includes("pubg")) return "mdi:parachute";

  return "mdi:gamepad-variant";
}

/**
 * Tailwind classes for a role badge. Common esport roles get a dedicated
 * accent color, while unknown roles fall back to a neutral palette.
 */
export function getRoleBadgeClasses(role: string | null | undefined): string {
  if (!role) {
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
  const value = role.toLowerCase();

  // LoL roles
  if (value.includes("top")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (value.includes("jungle"))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (value.includes("mid"))
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
  if (value.includes("adc") || value.includes("bot") || value.includes("carry"))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  if (value.includes("support"))
    return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";

  // CS / FPS roles
  if (value.includes("awp") || value.includes("sniper"))
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
  if (value.includes("rifler"))
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  if (value.includes("igl"))
    return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";

  // Generic fallback
  return "bg-palette-primary-100 text-palette-primary-700 dark:bg-palette-primary-900/30 dark:text-palette-primary-300";
}

/**
 * Status of a match → display label key + tone.
 * The label is a translation key under `esport.players.matchStatus`.
 */
export function getMatchStatusInfo(status: string): {
  labelKey: "live" | "upcoming" | "finished" | "canceled" | "postponed";
  tone: "live" | "upcoming" | "finished" | "neutral";
} {
  switch (status) {
    case "running":
      return { labelKey: "live", tone: "live" };
    case "not_started":
      return { labelKey: "upcoming", tone: "upcoming" };
    case "finished":
      return { labelKey: "finished", tone: "finished" };
    case "canceled":
      return { labelKey: "canceled", tone: "neutral" };
    case "postponed":
      return { labelKey: "postponed", tone: "neutral" };
    default:
      return { labelKey: "finished", tone: "neutral" };
  }
}
