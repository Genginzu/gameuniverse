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

/** Platform metadata for UI display. Logos are monochrome so they follow the site palette. */
export const PLATFORM_META: Record<
  GamingPlatform,
  { icon: string; color: string; authType: AuthType }
> = {
  steam: { icon: "mdi:steam", color: "text-white", authType: "oauth" },
  xbox: {
    icon: "mdi:microsoft-xbox",
    color: "text-white",
    authType: "oauth",
  },
  playstation: {
    icon: "mdi:sony-playstation",
    color: "text-white",
    authType: "npsso",
  },
  epic: {
    icon: "simple-icons:epicgames",
    color: "text-white",
    authType: "oauth",
  },
  battlenet: {
    icon: "simple-icons:battledotnet",
    color: "text-white",
    authType: "oauth",
  },
  discord: {
    icon: "simple-icons:discord",
    color: "text-white",
    authType: "oauth",
  },
  itch: {
    icon: "simple-icons:itchdotio",
    color: "text-white",
    authType: "oauth",
  },
  gog: {
    icon: "simple-icons:gogdotcom",
    color: "text-white",
    authType: "manual",
  },
  nintendo: {
    icon: "mdi:nintendo-switch",
    color: "text-white",
    authType: "manual",
  },
  ea: {
    icon: "simple-icons:ea",
    color: "text-white",
    authType: "manual",
  },
  ubisoft: {
    icon: "simple-icons:ubisoft",
    color: "text-white",
    authType: "manual",
  },
};

export function isConnectedPlatform(platform: GamingPlatform): boolean {
  return PLATFORM_META[platform].authType !== "manual";
}
