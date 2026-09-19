import { describe, it, expect } from "vitest";
import {
  flattenResults,
  computeNextIndex,
  computePrevIndex,
  getResultUrl,
  getAvailableTabs,
  cycleTab,
  type FlatSearchItem,
  type SearchTab,
} from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";

/** Helper: minimal valid response with empty arrays for each group. */
function emptyResponse(): GlobalSearchResponse {
  return {
    games: [],
    characters: [],
    players: [],
    teams: [],
    proPlayers: [],
    coaches: [],
    counts: {
      games: 0,
      characters: 0,
      players: 0,
      teams: 0,
      proPlayers: 0,
      coaches: 0,
    },
  };
}

// ============================================================================
// flattenResults
// ============================================================================

describe("flattenResults", () => {
  it("returns empty array for null results", () => {
    expect(flattenResults(null)).toEqual([]);
  });

  it("flattens results in canonical order: games → characters → players → teams → proPlayers → coaches", () => {
    const response: GlobalSearchResponse = {
      games: [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }],
      characters: [{ id: "c1", slug: "link", name: "Link" }],
      players: [{ id: "p1", username: "player1" }],
      teams: [{ id: 100, name: "G2", slug: "g2" }],
      proPlayers: [{ id: 200, name: "Caps", slug: "caps" }],
      coaches: [{ id: "c-1", username: "coachname", averageRating: 4.5, totalReviews: 10, isVerified: true }],
      counts: { games: 1, characters: 1, players: 1, teams: 1, proPlayers: 1, coaches: 1 },
    };

    const flat = flattenResults(response);
    expect(flat).toHaveLength(6);
    expect(flat[0].type).toBe("game");
    expect(flat[1].type).toBe("character");
    expect(flat[2].type).toBe("player");
    expect(flat[3].type).toBe("team");
    expect(flat[4].type).toBe("proPlayer");
    expect(flat[5].type).toBe("coach");
  });

  it("skips empty categories", () => {
    const response = emptyResponse();
    response.characters = [{ id: "c1", slug: "link", name: "Link" }];
    response.coaches = [
      { id: "co-1", username: "coachname", averageRating: 0, totalReviews: 0, isVerified: false },
    ];
    response.counts.characters = 1;
    response.counts.coaches = 1;

    const flat = flattenResults(response);
    expect(flat).toHaveLength(2);
    expect(flat[0].type).toBe("character");
    expect(flat[1].type).toBe("coach");
  });

  it("preserves the property values of each item via spread", () => {
    const response = emptyResponse();
    response.teams = [
      { id: 42, name: "Team Liquid", slug: "team-liquid", acronym: "TL" },
    ];
    response.counts.teams = 1;

    const [item] = flattenResults(response);
    expect(item).toMatchObject({
      type: "team",
      id: 42,
      name: "Team Liquid",
      slug: "team-liquid",
      acronym: "TL",
    });
  });
});

// ============================================================================
// flattenResults — tab filtering
// ============================================================================

function fullResponse(): GlobalSearchResponse {
  return {
    games: [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }],
    characters: [{ id: "c1", slug: "link", name: "Link" }],
    players: [{ id: "p1", username: "player1" }],
    teams: [{ id: 100, name: "G2", slug: "g2" }],
    proPlayers: [{ id: 200, name: "Caps", slug: "caps" }],
    coaches: [
      { id: "co1", username: "coachname", averageRating: 4.5, totalReviews: 10, isVerified: true },
    ],
    counts: { games: 1, characters: 1, players: 1, teams: 1, proPlayers: 1, coaches: 1 },
  };
}

describe("flattenResults with a tab filter", () => {
  it('returns every group when tab is "all"', () => {
    expect(flattenResults(fullResponse(), "all")).toHaveLength(6);
  });

  it("returns only the selected group's items", () => {
    const flat = flattenResults(fullResponse(), "characters");
    expect(flat).toHaveLength(1);
    expect(flat[0].type).toBe("character");
  });

  it("returns an empty list for a group with no results", () => {
    const response = emptyResponse();
    response.games = [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }];
    response.counts.games = 1;
    expect(flattenResults(response, "players")).toEqual([]);
  });
});

// ============================================================================
// getAvailableTabs
// ============================================================================

describe("getAvailableTabs", () => {
  it("returns an empty array for null results", () => {
    expect(getAvailableTabs(null)).toEqual([]);
  });

  it('shows "all" + the single group when only one group has results', () => {
    const response = emptyResponse();
    response.games = [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }];
    response.counts.games = 1;
    expect(getAvailableTabs(response)).toEqual(["all", "games"]);
  });

  it('prefixes "all" and lists non-empty groups in canonical order', () => {
    const response = emptyResponse();
    response.games = [{ id: "g1", slug: "zelda", title: "Zelda", source: "local" }];
    response.players = [{ id: "p1", username: "player1" }];
    response.counts.games = 1;
    response.counts.players = 1;
    expect(getAvailableTabs(response)).toEqual(["all", "games", "players"]);
  });

  it("includes every non-empty group", () => {
    expect(getAvailableTabs(fullResponse())).toEqual([
      "all",
      "games",
      "characters",
      "players",
      "teams",
      "proPlayers",
      "coaches",
    ]);
  });
});

// ============================================================================
// cycleTab
// ============================================================================

describe("cycleTab", () => {
  const tabs: SearchTab[] = ["all", "games", "players"];

  it("moves forward", () => {
    expect(cycleTab("all", tabs, 1)).toBe("games");
    expect(cycleTab("games", tabs, 1)).toBe("players");
  });

  it("wraps around to the first tab when moving forward past the end", () => {
    expect(cycleTab("players", tabs, 1)).toBe("all");
  });

  it("moves backward and wraps to the last tab", () => {
    expect(cycleTab("games", tabs, -1)).toBe("all");
    expect(cycleTab("all", tabs, -1)).toBe("players");
  });

  it('falls back to "all" when there are no tabs', () => {
    expect(cycleTab("games", [], 1)).toBe("all");
  });

  it("falls back to the first tab when current is not in the list", () => {
    expect(cycleTab("teams", tabs, 1)).toBe("all");
  });
});

// ============================================================================
// computeNextIndex
// ============================================================================

describe("computeNextIndex", () => {
  it("moves from -1 to 0", () => {
    expect(computeNextIndex(-1, 5)).toBe(0);
  });

  it("increments normally", () => {
    expect(computeNextIndex(2, 5)).toBe(3);
  });

  it("clamps at last index", () => {
    expect(computeNextIndex(4, 5)).toBe(4);
  });

  it("returns -1 when no results", () => {
    expect(computeNextIndex(-1, 0)).toBe(-1);
  });
});

// ============================================================================
// computePrevIndex
// ============================================================================

describe("computePrevIndex", () => {
  it("moves from 3 to 2", () => {
    expect(computePrevIndex(3)).toBe(2);
  });

  it("clamps at -1", () => {
    expect(computePrevIndex(0)).toBe(-1);
  });

  it("stays at -1 when already there", () => {
    expect(computePrevIndex(-1)).toBe(-1);
  });
});

// ============================================================================
// getResultUrl
// ============================================================================

describe("getResultUrl", () => {
  it("returns correct URL for local game (no locale prefix)", () => {
    const item: FlatSearchItem = {
      type: "game",
      id: "g1",
      slug: "zelda",
      title: "Zelda",
      source: "local",
    };
    expect(getResultUrl(item)).toBe("/games/zelda");
  });

  it("returns null for IGDB game (needs import first)", () => {
    const item: FlatSearchItem = {
      type: "game",
      id: "g2",
      slug: "mario",
      title: "Mario",
      source: "igdb",
    };
    expect(getResultUrl(item)).toBeNull();
  });

  it("returns correct URL for character", () => {
    const item: FlatSearchItem = {
      type: "character",
      id: "c1",
      slug: "link",
      name: "Link",
    };
    expect(getResultUrl(item)).toBe("/characters/link");
  });

  it("returns correct URL for player", () => {
    const item: FlatSearchItem = {
      type: "player",
      id: "p1",
      username: "player1",
    };
    expect(getResultUrl(item)).toBe("/players/p1");
  });

  it("returns correct URL for esport team using its pandascore_id", () => {
    const item: FlatSearchItem = {
      type: "team",
      id: 100,
      name: "G2 Esports",
      slug: "g2-esports",
    };
    expect(getResultUrl(item)).toBe("/esport/teams/100");
  });

  it("returns correct URL for esport pro player using its pandascore_id", () => {
    const item: FlatSearchItem = {
      type: "proPlayer",
      id: 9999,
      name: "Caps",
      slug: "caps",
    };
    expect(getResultUrl(item)).toBe("/esport/players/9999");
  });

  it("returns correct URL for coach using their public username", () => {
    const item: FlatSearchItem = {
      type: "coach",
      id: "coach-uuid",
      username: "topcoach",
      averageRating: 4.8,
      totalReviews: 25,
      isVerified: true,
    };
    expect(getResultUrl(item)).toBe("/coaching/topcoach");
  });
});
