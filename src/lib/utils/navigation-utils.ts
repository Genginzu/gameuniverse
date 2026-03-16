import {
  FaComments,
  FaDice,
  FaGamepad,
  FaHeart,
  FaUser,
  FaUserFriends,
  FaMask,
} from "react-icons/fa";
import type { IconType } from "react-icons";

export interface NavLink {
  href: string;
  icon: IconType;
  labelKey: string;
}

/** Main navigation links for the authenticated area. */
export const NAV_LINKS: NavLink[] = [
  { href: "/profile", icon: FaUser, labelKey: "profile" },
  { href: "/library", icon: FaGamepad, labelKey: "library" },
  { href: "/favorites/characters", icon: FaHeart, labelKey: "myCharacters" },
  { href: "/discussions", icon: FaComments, labelKey: "discussions" },
];

/** Public navigation links visible to all users. */
export const PUBLIC_LINKS: NavLink[] = [
  { href: "/games", icon: FaDice, labelKey: "games" },
  { href: "/characters", icon: FaMask, labelKey: "characters" },
  { href: "/players", icon: FaUserFriends, labelKey: "players" },
];

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

  return normalizedPathname === linkPath || normalizedPathname.startsWith(linkPath + "/");
}
