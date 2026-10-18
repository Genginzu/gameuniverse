import type { ConnectedPlatform, GamingPlatform } from "@/types/linked-platforms";
import type { PlatformConnectionAdapter } from "@/types/platform-connection";
import { battlenetConnection } from "./battlenet";
import { discordConnection } from "./discord";
import { epicConnection } from "./epic";
import { itchConnection } from "./itch";
import { psnConnection } from "./psn";
import { steamConnection } from "./steam";
import { xboxConnection } from "./xbox";

export {
  battlenetConnection,
  discordConnection,
  epicConnection,
  itchConnection,
  psnConnection,
  steamConnection,
  xboxConnection,
};

const CONNECTION_ADAPTERS: Record<ConnectedPlatform, PlatformConnectionAdapter> = {
  steam: steamConnection,
  xbox: xboxConnection,
  playstation: psnConnection,
  epic: epicConnection,
  battlenet: battlenetConnection,
  discord: discordConnection,
  itch: itchConnection,
};

export function getConnectionAdapter(platform: GamingPlatform): PlatformConnectionAdapter | null {
  return CONNECTION_ADAPTERS[platform as ConnectedPlatform] ?? null;
}
