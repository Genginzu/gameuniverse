/**
 * Entries of the editorial mega-menu (public top bar), shared with the
 * mobile navigation overlay.
 */

export type MegaMenuEntryKey = "games" | "characters" | "players" | "esport";

export interface MegaMenuLink {
  /** Href without locale prefix. */
  href: string;
  /** i18n sub-key under `editorial.megaMenu.links.{entry}`. */
  labelKey: string;
  /** Iconify icon (`lucide:`, `fa:`, `mdi:`…). */
  icon: string;
}

export interface MegaMenuSection {
  /** i18n sub-key under `editorial.megaMenu.sections.{entry}`. */
  titleKey: string;
  links: MegaMenuLink[];
}

export interface MegaMenuEntry {
  key: MegaMenuEntryKey;
  /** Iconify icon shown next to the entry label. */
  icon: string;
  /** Path prefixes that mark this entry as active. */
  pathPrefixes: string[];
  sections: MegaMenuSection[];
}

/**
 * Top bar = **contenu public** uniquement. Tout ce qui est propre à
 * l'utilisateur connecté (bibliothèque, pronostics, coaching, compte) vit
 * dans le rail / la sub-sidebar (voir `EDITORIAL_SPACES`).
 */
export const EDITORIAL_MEGA_MENU_ENTRIES: readonly MegaMenuEntry[] = [
  {
    key: "games",
    icon: "fa:dice",
    pathPrefixes: ["/games", "/trending", "/upcoming"],
    sections: [
      {
        titleKey: "explore",
        links: [
          { href: "/games", labelKey: "all", icon: "lucide:gamepad-2" },
          { href: "/trending", labelKey: "trending", icon: "lucide:flame" },
          { href: "/upcoming", labelKey: "upcoming", icon: "lucide:calendar-clock" },
        ],
      },
    ],
  },
  {
    key: "characters",
    icon: "fa:user-ninja",
    pathPrefixes: ["/characters"],
    sections: [
      {
        titleKey: "explore",
        links: [{ href: "/characters", labelKey: "all", icon: "lucide:users-round" }],
      },
    ],
  },
  {
    key: "players",
    icon: "fa:user-friends",
    pathPrefixes: ["/players"],
    sections: [
      {
        titleKey: "community",
        links: [{ href: "/players", labelKey: "all", icon: "lucide:users" }],
      },
    ],
  },
  {
    key: "esport",
    icon: "fa:bolt",
    pathPrefixes: [
      "/esport/live",
      "/esport/calendar",
      "/esport/tournaments",
      "/esport/results",
      "/esport/teams",
      "/esport/players",
    ],
    sections: [
      {
        titleKey: "competitions",
        links: [
          { href: "/esport/live", labelKey: "live", icon: "lucide:radio" },
          { href: "/esport/calendar", labelKey: "calendar", icon: "lucide:calendar" },
          { href: "/esport/tournaments", labelKey: "tournaments", icon: "lucide:trophy" },
          { href: "/esport/results", labelKey: "results", icon: "lucide:list-checks" },
        ],
      },
      {
        titleKey: "proScene",
        links: [
          { href: "/esport/teams", labelKey: "teams", icon: "lucide:users" },
          { href: "/esport/players", labelKey: "proPlayers", icon: "lucide:gamepad-2" },
        ],
      },
    ],
  },
];

/** Returns the entry that matches the given pathname, or null. */
export function megaMenuEntryFromPathname(pathname: string | null): MegaMenuEntryKey | null {
  if (!pathname) return null;
  for (const entry of EDITORIAL_MEGA_MENU_ENTRIES) {
    for (const prefix of entry.pathPrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return entry.key;
      }
    }
  }
  return null;
}

