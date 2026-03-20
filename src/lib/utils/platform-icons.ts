/**
 * Maps platform slugs (from IGDB) to Iconify icon names.
 * Uses Simple Icons (Si*) for brand logos and Font Awesome (Fa*) as fallbacks.
 */

/** Mapping of platform slug substrings to icons (order matters — first match wins) */
const PLATFORM_ICON_RULES: Array<{ match: (slug: string) => boolean; icon: string }> = [
  {
    match: (s) => s.includes("playstation") || s.startsWith("ps"),
    icon: "simple-icons:playstation",
  },
  { match: (s) => s.includes("xbox"), icon: "fa:xbox" },
  { match: (s) => s.includes("switch"), icon: "simple-icons:nintendoswitch" },
  {
    match: (s) =>
      s.includes("nintendo") ||
      s.includes("wii") ||
      s.includes("game-boy") ||
      s.includes("game boy") ||
      s.includes("nes") ||
      s.includes("snes") ||
      s.includes("n64") ||
      s.includes("gamecube"),
    icon: "simple-icons:nintendo",
  },
  { match: (s) => s.includes("steam"), icon: "simple-icons:steam" },
  {
    match: (s) => s === "pc" || s.includes("windows") || s.includes("dos"),
    icon: "fa:desktop",
  },
  { match: (s) => s.includes("linux"), icon: "simple-icons:linux" },
  {
    match: (s) => s.includes("mac") || s.includes("ios") || s.includes("apple"),
    icon: "simple-icons:apple",
  },
  { match: (s) => s.includes("android"), icon: "simple-icons:android" },
  {
    match: (s) =>
      s.includes("sega") ||
      s.includes("dreamcast") ||
      s.includes("genesis") ||
      s.includes("mega-drive") ||
      s.includes("mega drive") ||
      s.includes("saturn"),
    icon: "simple-icons:sega",
  },
  { match: (s) => s.includes("atari"), icon: "simple-icons:atari" },
  { match: (s) => s.includes("mobile") || s.includes("phone"), icon: "fa:mobile-alt" },
  { match: (s) => s.includes("web") || s.includes("browser"), icon: "fa:globe" },
];

/** Returns the best matching icon for a platform slug, or a generic gamepad */
export function getPlatformIcon(slug: string): string {
  const normalized = slug.toLowerCase();
  const rule = PLATFORM_ICON_RULES.find((r) => r.match(normalized));
  return rule?.icon ?? "fa:gamepad";
}
