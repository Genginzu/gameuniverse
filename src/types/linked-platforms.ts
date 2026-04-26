// Types pour les plateformes gaming liées aux profils joueurs

export const GAMING_PLATFORMS = [
  "steam",
  "epic",
  "xbox",
  "playstation",
  "battlenet",
  "discord",
  "gog",
  "nintendo",
  "ea",
  "ubisoft",
  "itch",
] as const;

export type GamingPlatform = (typeof GAMING_PLATFORMS)[number];

/** Platforms with a real token-based connection (OAuth or NPSSO) — i.e. anything not manual */
export const CONNECTED_PLATFORMS = [
  "steam",
  "xbox",
  "playstation",
  "epic",
  "battlenet",
  "discord",
  "itch",
] as const;
export type ConnectedPlatform = (typeof CONNECTED_PLATFORMS)[number];

export type AuthType = "oauth" | "npsso" | "manual";

export interface LinkedPlatform {
  id: string;
  playerId: string;
  platform: GamingPlatform;
  platformUsername: string | null;
  platformAvatarUrl: string | null;
  authType: AuthType;
  externalId: string | null;
  tokenExpiresAt: string | null;
  isPublic: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Platform metadata for UI display */
export const PLATFORM_META: Record<
  GamingPlatform,
  { icon: string; color: string; authType: AuthType }
> = {
  steam: { icon: "mdi:steam", color: "text-gray-800 dark:text-gray-200", authType: "oauth" },
  xbox: {
    icon: "mdi:microsoft-xbox",
    color: "text-green-600 dark:text-green-400",
    authType: "oauth",
  },
  playstation: {
    icon: "mdi:sony-playstation",
    color: "text-blue-600 dark:text-blue-400",
    authType: "npsso",
  },
  epic: {
    icon: "simple-icons:epicgames",
    color: "text-gray-800 dark:text-gray-200",
    authType: "oauth",
  },
  battlenet: {
    icon: "simple-icons:battledotnet",
    color: "text-blue-500 dark:text-blue-300",
    authType: "oauth",
  },
  discord: {
    icon: "simple-icons:discord",
    color: "text-indigo-500 dark:text-indigo-400",
    authType: "oauth",
  },
  itch: {
    icon: "simple-icons:itchdotio",
    color: "text-red-500 dark:text-red-400",
    authType: "oauth",
  },
  gog: {
    icon: "simple-icons:gogdotcom",
    color: "text-purple-600 dark:text-purple-400",
    authType: "manual",
  },
  nintendo: {
    icon: "mdi:nintendo-switch",
    color: "text-red-600 dark:text-red-400",
    authType: "manual",
  },
  ea: {
    icon: "simple-icons:ea",
    color: "text-orange-600 dark:text-orange-400",
    authType: "manual",
  },
  ubisoft: {
    icon: "simple-icons:ubisoft",
    color: "text-blue-700 dark:text-blue-300",
    authType: "manual",
  },
};

export function isConnectedPlatform(platform: GamingPlatform): boolean {
  return PLATFORM_META[platform].authType !== "manual";
}
