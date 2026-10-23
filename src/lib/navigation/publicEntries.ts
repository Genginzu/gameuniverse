import type { NavPublicEntryDefinition } from "@/types/navigation";

/**
 * Public Entries: public catalogue only. Member-oriented destinations live in
 * `EDITORIAL_SPACES`. Labels resolve under `editorial.megaMenu.*`.
 */
export const PUBLIC_ENTRIES: readonly NavPublicEntryDefinition[] = [
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
