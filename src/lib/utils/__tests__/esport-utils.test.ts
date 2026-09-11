import { describe, it, expect } from "vitest";
import {
  countryCodeToFlag,
  getGameIcon,
  getRoleBadgeClasses,
  getMatchStatusInfo,
} from "@/lib/utils/esport-utils";

describe("countryCodeToFlag", () => {
  it("converts a valid lowercase ISO code to a flag emoji", () => {
    expect(countryCodeToFlag("fr")).toBe("🇫🇷");
  });

  it("converts a valid uppercase ISO code to a flag emoji", () => {
    expect(countryCodeToFlag("US")).toBe("🇺🇸");
  });

  it("trims surrounding whitespace", () => {
    expect(countryCodeToFlag("  GB  ")).toBe("🇬🇧");
  });

  it("returns null for null/undefined input", () => {
    expect(countryCodeToFlag(null)).toBeNull();
    expect(countryCodeToFlag(undefined)).toBeNull();
  });

  it("returns null for invalid (non-2-letter) input", () => {
    expect(countryCodeToFlag("FRA")).toBeNull();
    expect(countryCodeToFlag("")).toBeNull();
    expect(countryCodeToFlag("F1")).toBeNull();
  });
});

describe("getGameIcon", () => {
  it("returns a dedicated icon for known games", () => {
    expect(getGameIcon("League of Legends")).toBe("simple-icons:leagueoflegends");
    expect(getGameIcon("lol")).toBe("simple-icons:leagueoflegends");
    expect(getGameIcon("Valorant")).toBe("simple-icons:valorant");
    expect(getGameIcon("Counter-Strike 2")).toBe("simple-icons:counterstrike");
    expect(getGameIcon("Dota 2")).toBe("simple-icons:dota2");
    expect(getGameIcon("Rocket League")).toBe("simple-icons:rocketleague");
  });

  it("returns the fallback icon for unknown games", () => {
    expect(getGameIcon("UnknownGame")).toBe("mdi:gamepad-variant");
    expect(getGameIcon(null)).toBe("mdi:gamepad-variant");
    expect(getGameIcon("")).toBe("mdi:gamepad-variant");
  });
});

describe("getRoleBadgeClasses", () => {
  it("returns role-specific classes for known LoL roles", () => {
    expect(getRoleBadgeClasses("Top")).toContain("red-100");
    expect(getRoleBadgeClasses("Jungle")).toContain("emerald-100");
    expect(getRoleBadgeClasses("Mid")).toContain("purple-100");
    expect(getRoleBadgeClasses("Support")).toContain("sky-100");
  });

  it("matches ADC variants", () => {
    expect(getRoleBadgeClasses("ADC")).toContain("amber-100");
    expect(getRoleBadgeClasses("Bot Lane")).toContain("amber-100");
    expect(getRoleBadgeClasses("Carry")).toContain("amber-100");
  });

  it("returns FPS-specific classes", () => {
    expect(getRoleBadgeClasses("AWPer")).toContain("indigo-100");
    expect(getRoleBadgeClasses("IGL")).toContain("pink-100");
  });

  it("returns a neutral palette for null role", () => {
    expect(getRoleBadgeClasses(null)).toContain("gray-100");
    expect(getRoleBadgeClasses(undefined)).toContain("gray-100");
  });

  it("falls back to primary palette for unknown roles", () => {
    expect(getRoleBadgeClasses("UnknownRole")).toContain("palette-primary-100");
  });
});

describe("getMatchStatusInfo", () => {
  it.each([
    ["running", "live", "live"],
    ["not_started", "upcoming", "upcoming"],
    ["finished", "finished", "finished"],
    ["canceled", "canceled", "neutral"],
    ["postponed", "postponed", "neutral"],
  ] as const)("maps %s status to label %s with tone %s", (status, labelKey, tone) => {
    const info = getMatchStatusInfo(status);
    expect(info.labelKey).toBe(labelKey);
    expect(info.tone).toBe(tone);
  });

  it("falls back to finished/neutral for unknown statuses", () => {
    const info = getMatchStatusInfo("anything-else");
    expect(info.labelKey).toBe("finished");
    expect(info.tone).toBe("neutral");
  });
});
