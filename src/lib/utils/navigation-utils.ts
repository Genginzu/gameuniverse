export interface NavLink {
  href: string;
  icon: string;
  labelKey: string;
}

/** Main navigation links for the authenticated area. */
export const NAV_LINKS: NavLink[] = [
  { href: "/profile", icon: "fa:user", labelKey: "profile" },
  { href: "/library", icon: "fa:gamepad", labelKey: "library" },
  { href: "/favorites/characters", icon: "fa:heart", labelKey: "myCharacters" },
  { href: "/discussions", icon: "fa:comments", labelKey: "discussions" },
];

/** Coaching navigation links (authenticated only). */
export const COACHING_LINKS: NavLink[] = [
  { href: "/coaching", icon: "fa:users", labelKey: "coachingHub" },
  { href: "/coaching/sessions", icon: "fa:calendar", labelKey: "coachingSessions" },
  { href: "/coaching/settings", icon: "fa:graduation-cap", labelKey: "coachSettings" },
];

/** Public navigation links visible to all users. */
export const PUBLIC_LINKS: NavLink[] = [
  { href: "/games", icon: "fa:dice", labelKey: "games" },
  { href: "/characters", icon: "fa:mask", labelKey: "characters" },
  { href: "/players", icon: "fa:user-friends", labelKey: "players" },
];

/** Esport navigation links visible to all users. */
export const ESPORT_LINKS: NavLink[] = [
  { href: "/esport/calendar", icon: "fa:calendar", labelKey: "esportCalendar" },
  { href: "/esport/live", icon: "fa:bolt", labelKey: "esportLive" },
  { href: "/esport/results", icon: "fa:trophy", labelKey: "esportResults" },
  { href: "/esport/teams", icon: "fa:users", labelKey: "esportTeams" },
  { href: "/esport/players", icon: "fa:user", labelKey: "esportPlayers" },
  { href: "/esport/predictions", icon: "fa:bar-chart", labelKey: "esportPredictions" },
];

/** Paths that should only highlight on exact match, not on sub-routes */
const EXACT_MATCH_PATHS = new Set(["/coaching"]);

/**
 * Determines if a navigation link is active based on the current pathname.
 * Strips the locale prefix (e.g. /fr, /en) before comparing.
 *
 * When `currentUserId` is provided and the user is viewing their own player
 * page (`/players/{currentUserId}`), the `/profile` link is considered active
 * instead of `/players`.
 */
export function isActive(pathname: string, linkPath: string, currentUserId?: string): boolean {
  const normalizedPathname = pathname.replace(/^\/(fr|en)(?=\/|$)/, "") || "/";

  // When viewing own profile (/players/{currentUserId}), activate /profile, not /players
  if (currentUserId) {
    const ownProfilePath = `/players/${currentUserId}`;
    const isOnOwnProfile =
      normalizedPathname === ownProfilePath || normalizedPathname.startsWith(ownProfilePath + "/");

    if (isOnOwnProfile) {
      return linkPath === "/profile";
    }
  }

  if (normalizedPathname === linkPath) return true;
  if (EXACT_MATCH_PATHS.has(linkPath)) return false;
  return normalizedPathname.startsWith(linkPath + "/");
}
