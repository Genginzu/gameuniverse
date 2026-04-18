import { describe, it, expect } from "vitest";
import {
  discordConnectionToPlatform,
  buildSuggestionsFromDiscord,
} from "@/lib/services/discordConnections";

describe("discordConnectionToPlatform", () => {
  it.each([
    ["steam", "steam"],
    ["xbox", "xbox"],
    ["playstation", "playstation"],
    ["epicgames", "epic"],
    ["battlenet", "battlenet"],
    ["ubisoft", "ubisoft"],
    ["ea", "ea"],
    ["gog", "gog"],
    ["itch", "itch"],
  ])("maps discord type %s → %s", (type, expected) => {
    expect(discordConnectionToPlatform(type)).toBe(expected);
  });

  it("returns null for non-gaming types", () => {
    expect(discordConnectionToPlatform("twitter")).toBeNull();
    expect(discordConnectionToPlatform("spotify")).toBeNull();
    expect(discordConnectionToPlatform("")).toBeNull();
  });
});

describe("buildSuggestionsFromDiscord", () => {
  it("keeps only gaming platforms not already linked", () => {
    const connections = [
      { type: "steam", id: "123", name: "steamUser", verified: true },
      { type: "twitter", id: "t", name: "t", verified: false },
      { type: "xbox", id: "456", name: "xboxGT", verified: true },
      { type: "epicgames", id: "789", name: "epicUser", verified: false },
    ];
    const result = buildSuggestionsFromDiscord(connections, ["xbox"]);
    expect(result).toEqual([
      { platform: "steam", username: "steamUser", verified: true },
      { platform: "epic", username: "epicUser", verified: false },
    ]);
  });

  it("de-duplicates multiple connections of the same platform", () => {
    const connections = [
      { type: "steam", id: "a", name: "first", verified: true },
      { type: "steam", id: "b", name: "second", verified: false },
    ];
    const result = buildSuggestionsFromDiscord(connections, []);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("first");
  });

  it("returns empty when no connections", () => {
    expect(buildSuggestionsFromDiscord([], [])).toEqual([]);
  });
});
