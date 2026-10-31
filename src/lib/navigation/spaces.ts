import type { NavLinkDefinition, NavSpaceDefinition, NavSpaceKey } from "@/types/navigation";

const LIBRARY_HOME: NavLinkDefinition = {
  href: "/library",
  labelKey: "myLibrary",
  icon: "lucide:library",
};

/**
 * Spaces: member-oriented destinations. Labels resolve under
 * `editorial.spaces.{key}` and `editorial.links.{key}.{labelKey}`.
 */
export const EDITORIAL_SPACES: readonly NavSpaceDefinition[] = [
  {
    key: "social",
    icon: "fa:hashtag",
    pathPrefixes: ["/posts", "/feed"],
    links: [
      { href: "/feed", labelKey: "feed", icon: "lucide:newspaper" },
      { href: "/posts/tags", labelKey: "tags", icon: "lucide:hash" },
    ],
  },
  {
    key: "groups",
    icon: "lucide:users",
    pathPrefixes: ["/groups"],
    links: [
      { href: "/groups", labelKey: "all", icon: "lucide:users" },
      { href: "/groups?create=1", labelKey: "create", icon: "lucide:plus-circle" },
    ],
    membership: { source: "groups", basePath: "/groups", fallbackIcon: "lucide:users" },
  },
  {
    key: "communities",
    icon: "fa:globe",
    pathPrefixes: ["/communities"],
    links: [
      { href: "/communities", labelKey: "all", icon: "lucide:globe-2" },
      { href: "/communities?create=1", labelKey: "create", icon: "lucide:plus-circle" },
    ],
    membership: {
      source: "communities",
      basePath: "/communities",
      fallbackIcon: "lucide:globe-2",
    },
  },
  {
    key: "library",
    icon: "fa:gamepad",
    pathPrefixes: ["/library", "/collections", "/favorites/characters"],
    links: [
      LIBRARY_HOME,
      { href: "/library/backlog", labelKey: "backlog", icon: "lucide:list-checks" },
      { href: "/library/wishlist", labelKey: "wishlist", icon: "lucide:star" },
      { href: "/collections", labelKey: "collections", icon: "lucide:folder-heart" },
      { href: "/favorites/characters", labelKey: "favoriteCharacters", icon: "lucide:heart" },
      { href: "/library/connections", labelKey: "connections", icon: "lucide:plug-zap" },
    ],
  },
  {
    key: "esport",
    icon: "fa:bolt",
    pathPrefixes: ["/esport/predictions", "/esport/fantasy"],
    links: [
      { href: "/esport/predictions", labelKey: "predictions", icon: "lucide:target" },
      { href: "/esport/fantasy", labelKey: "fantasy", icon: "lucide:sparkles" },
    ],
  },
  {
    key: "coaching",
    icon: "fa:graduation-cap",
    pathPrefixes: ["/coaching"],
    links: [
      { href: "/coaching", labelKey: "hub", icon: "lucide:layout-dashboard" },
      { href: "/coaching/sessions", labelKey: "sessions", icon: "lucide:calendar-clock" },
      { href: "/coaching/settings", labelKey: "settings", icon: "lucide:settings" },
    ],
  },
  {
    key: "account",
    icon: "fa:user",
    pathPrefixes: ["/friends", "/discussions", "/coins", "/notifications"],
    links: [
      {
        href: "/notifications",
        labelKey: "notifications",
        icon: "lucide:bell",
        badge: "unreadNotifications",
      },
      { href: "/friends", labelKey: "friends", icon: "lucide:users", badge: "pendingFriends" },
      { href: "/discussions", labelKey: "discussions", icon: "lucide:messages-square" },
      { href: "/coins", labelKey: "coins", icon: "lucide:coins" },
    ],
  },
];

export const EDITORIAL_SPACE_KEYS: readonly NavSpaceKey[] = EDITORIAL_SPACES.map((s) => s.key);

/** Account Links, labels under `editorial.links.account.{labelKey}`. */
export const ACCOUNT_LINKS: readonly NavLinkDefinition[] = [
  { href: "/profile", labelKey: "profile", icon: "lucide:user" },
  { ...LIBRARY_HOME, labelKey: "library" },
  { href: "/settings", labelKey: "settings", icon: "lucide:settings" },
];
