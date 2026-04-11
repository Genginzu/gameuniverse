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

export interface LinkedPlatform {
  id: string;
  playerId: string;
  platform: GamingPlatform;
  platformUsername: string;
  createdAt: string;
  updatedAt: string;
}

/** Platform metadata for UI display */
export interface PlatformMeta {
  key: GamingPlatform;
  icon: string;
  color: string;
}

export const PLATFORM_META: Record<GamingPlatform, Omit<PlatformMeta, "key">> = {
  steam: { icon: "mdi:steam", color: "text-gray-800 dark:text-gray-200" },
  epic: { icon: "mdi:gamepad-variant", color: "text-gray-800 dark:text-gray-200" },
  xbox: { icon: "mdi:microsoft-xbox", color: "text-green-600 dark:text-green-400" },
  playstation: { icon: "mdi:sony-playstation", color: "text-blue-600 dark:text-blue-400" },
  gog: { icon: "simple-icons:gogdotcom", color: "text-purple-600 dark:text-purple-400" },
  nintendo: { icon: "mdi:nintendo-switch", color: "text-red-600 dark:text-red-400" },
  battlenet: { icon: "mdi:controller", color: "text-blue-500 dark:text-blue-300" },
  ea: { icon: "mdi:controller-classic", color: "text-orange-600 dark:text-orange-400" },
  ubisoft: { icon: "simple-icons:ubisoft", color: "text-blue-700 dark:text-blue-300" },
  itch: { icon: "mdi:gamepad-square", color: "text-red-500 dark:text-red-400" },
};
