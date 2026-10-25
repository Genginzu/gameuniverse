import { describe, it, expect } from "vitest";

import { summarizeMultiplayer } from "@/lib/utils/multiplayerSummary";
import type { GameMultiplayerMode } from "@/types/game-metadata";

const base: GameMultiplayerMode = {
  platformName: null,
  campaignCoop: false,
  dropIn: false,
  lanCoop: false,
  offlineCoop: false,
  offlineCoopMax: null,
  offlineMax: null,
  onlineCoop: false,
  onlineCoopMax: null,
  onlineMax: null,
  splitscreen: false,
  splitscreenOnline: false,
};

describe("summarizeMultiplayer", () => {
  it("returns nothing for games without multiplayer", () => {
    expect(summarizeMultiplayer([base])).toEqual({ capabilities: [], platforms: [] });
  });

  it("keeps the highest player cap across platforms", () => {
    const { capabilities, platforms } = summarizeMultiplayer([
      { ...base, platformName: "Xbox", onlineMax: 4, onlineCoopMax: 2 },
      { ...base, platformName: "PC", onlineMax: 16 },
      { ...base, platformName: "PC", splitscreen: true },
    ]);

    expect(capabilities).toEqual([
      { key: "onlineMax", players: 16 },
      { key: "onlineCoop", players: 2 },
      { key: "splitscreen", players: null },
    ]);
    expect(platforms).toEqual(["PC", "Xbox"]);
  });

  it("ignores zero caps but keeps flagged capabilities", () => {
    const { capabilities } = summarizeMultiplayer([{ ...base, offlineCoop: true, offlineCoopMax: 0, dropIn: true }]);

    expect(capabilities).toEqual([
      { key: "offlineCoop", players: null },
      { key: "dropIn", players: null },
    ]);
  });
});
