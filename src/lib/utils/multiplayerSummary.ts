import type { GameMultiplayerMode } from "@/types/game-metadata";

/** One multiplayer capability of a game, with its player cap when IGDB gives one. */
export interface MultiplayerCapability {
  key:
    | "onlineMax"
    | "onlineCoop"
    | "offlineMax"
    | "offlineCoop"
    | "splitscreen"
    | "splitscreenOnline"
    | "lanCoop"
    | "campaignCoop"
    | "dropIn";
  players: number | null;
}

const maxOf = (values: Array<number | null>) => {
  const numbers = values.filter((value): value is number => typeof value === "number" && value > 0);
  return numbers.length > 0 ? Math.max(...numbers) : null;
};

/**
 * Merges the per-platform IGDB multiplayer rows into one list of
 * capabilities (any platform offering it), with the highest player cap.
 */
export function summarizeMultiplayer(modes: GameMultiplayerMode[]): {
  capabilities: MultiplayerCapability[];
  platforms: string[];
} {
  const any = (pick: (mode: GameMultiplayerMode) => boolean) => modes.some(pick);
  const capabilities: MultiplayerCapability[] = [];
  const add = (key: MultiplayerCapability["key"], enabled: boolean, players: number | null = null) => {
    if (enabled) capabilities.push({ key, players });
  };

  const onlineMax = maxOf(modes.map((mode) => mode.onlineMax));
  const onlineCoopMax = maxOf(modes.map((mode) => mode.onlineCoopMax));
  const offlineMax = maxOf(modes.map((mode) => mode.offlineMax));
  const offlineCoopMax = maxOf(modes.map((mode) => mode.offlineCoopMax));

  add("onlineMax", onlineMax !== null, onlineMax);
  add("onlineCoop", any((mode) => mode.onlineCoop) || onlineCoopMax !== null, onlineCoopMax);
  add("offlineMax", offlineMax !== null, offlineMax);
  add("offlineCoop", any((mode) => mode.offlineCoop) || offlineCoopMax !== null, offlineCoopMax);
  add("splitscreen", any((mode) => mode.splitscreen));
  add("splitscreenOnline", any((mode) => mode.splitscreenOnline));
  add("lanCoop", any((mode) => mode.lanCoop));
  add("campaignCoop", any((mode) => mode.campaignCoop));
  add("dropIn", any((mode) => mode.dropIn));

  const platforms = [
    ...new Set(modes.map((mode) => mode.platformName).filter((name): name is string => Boolean(name))),
  ].sort((a, b) => a.localeCompare(b));

  return { capabilities, platforms };
}
