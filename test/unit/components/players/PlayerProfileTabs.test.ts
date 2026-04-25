import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getDefaultTab } from "@/components/players/PlayerProfileTabs";

describe("getDefaultTab", () => {
  it("returns 'feed' for owners", () => {
    expect(getDefaultTab(true)).toBe("feed");
  });

  it("returns 'activity' for visitors", () => {
    expect(getDefaultTab(false)).toBe("activity");
  });

  it("property: isOwner iff result === 'feed'", () => {
    fc.assert(
      fc.property(fc.boolean(), (isOwner) => {
        const result = getDefaultTab(isOwner);
        return (isOwner && result === "feed") || (!isOwner && result === "activity");
      })
    );
  });
});
