// Types pour les plateformes gaming liées aux profils joueurs

export const GAMING_PLATFORMS = [
  "steam",
  "epic",
  "xbox",
  "playstation",
  "gog",
  "nintendo",
  "battlenet",
  "ea",
  "ubisoft",
  "itch",
] as const;

export type GamingPlatform = (typeof GAMING_PLATFORMS)[number];

/** Platforms that support real OAuth/token-based connection */
export const OAUTH_PLATFORMS = ["steam", "xbox", "playstation"] as const;
export type OAuthPlatform = (typeof OAUTH_PLATFORMS)[number];

export type AuthType = "oauth" | "npsso" | "manual";

export interface LinkedPlatform {
  id: string;
  playerId: string;
  platform: GamingPlatform;
  platformUsername: string | null;
  authType: AuthType;
  externalId: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Platform metadata for UI display */
export const PLATFORM_META: Record<GamingPlatform, { icon: string; color: string; authType: AuthType }> = {
  steam: { icon: "mdi:steam", color: "text-gray-800 dark:text-gray-200", authType: "oauth" },
  xbox: { icon: "mdi:microsoft-xbox", color: "text-green-600 dark:text-green-400", authType: "oauth" },
  playstation: { icon: "mdi:sony-playstation", color: "text-blue-600 dark:text-blue-400", authType: "npsso" },
  epic: { icon: "mdi:gamepad-variant", color: "text-gray-800 dark:text-gray-200", authType: "manual" },
  gog: { icon: "simple-icons:gogdotcom", color: "text-purple-600 dark:text-purple-400", authType: "manual" },
  nintendo: { icon: "mdi:nintendo-switch", color: "text-red-600 dark:text-red-400", authType: "manual" },
  battlenet: { icon: "mdi:controller", color: "text-blue-500 dark:text-blue-300", authType: "manual" },
  ea: { icon: "mdi:controller-classic", color: "text-orange-600 dark:text-orange-400", authType: "manual" },
  ubisoft: { icon: "simple-icons:ubisoft", color: "text-blue-700 dark:text-blue-300", authType: "manual" },
  itch: { icon: "mdi:gamepad-square", color: "text-red-500 dark:text-red-400", authType: "manual" },
};

export function isOAuthPlatform(platform: GamingPlatform): boolean {
  return PLATFORM_META[platform].authType !== "manual";
}
