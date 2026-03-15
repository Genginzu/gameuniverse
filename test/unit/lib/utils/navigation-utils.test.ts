import { describe, it, expect } from "vitest";
import { isActive, NAV_LINKS, PUBLIC_LINKS } from "@/lib/utils/navigation-utils";

// =============================================================================
// NAV_LINKS & PUBLIC_LINKS constants
// =============================================================================

describe("NAV_LINKS", () => {
  it("contains exactly 3 links", () => {
    expect(NAV_LINKS).toHaveLength(3);
  });

  it("each link has href, icon, and labelKey", () => {
    for (const link of NAV_LINKS) {
      expect(link.href).toBeTruthy();
      expect(typeof link.icon).toBe("function");
      expect(link.labelKey).toBeTruthy();
    }
  });
});

describe("PUBLIC_LINKS", () => {
  it("contains exactly 3 links", () => {
    expect(PUBLIC_LINKS).toHaveLength(3);
  });

  it("each link has href, icon, and labelKey", () => {
    for (const link of PUBLIC_LINKS) {
      expect(link.href).toBeTruthy();
      expect(typeof link.icon).toBe("function");
      expect(link.labelKey).toBeTruthy();
    }
  });
});

// =============================================================================
// isActive
// =============================================================================

describe("isActive", () => {
  // --- Exact path match ---
  it("returns true for an exact path match", () => {
    expect(isActive("/dashboard", "/dashboard")).toBe(true);
    expect(isActive("/library", "/library")).toBe(true);
  });

  // --- Sub-path match ---
  it("returns true when pathname is a sub-path of linkPath", () => {
    expect(isActive("/library/123", "/library")).toBe(true);
    expect(isActive("/games/my-game", "/games")).toBe(true);
  });

  // --- Non-matching path ---
  it("returns false for a non-matching path", () => {
    expect(isActive("/settings", "/dashboard")).toBe(false);
    expect(isActive("/games", "/library")).toBe(false);
  });

  // --- Partial name overlap should not match ---
  it("returns false when pathname shares a prefix but is a different route", () => {
    // "/games" should NOT match "/game" (no trailing slash boundary)
    expect(isActive("/gamesExtra", "/games")).toBe(false);
  });

  // --- Root path ---
  it("handles root path correctly", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/dashboard", "/")).toBe(false);
  });

  // --- With locale prefix ---
  it("strips /fr locale prefix before comparing", () => {
    expect(isActive("/fr/dashboard", "/dashboard")).toBe(true);
    expect(isActive("/fr/library/42", "/library")).toBe(true);
  });

  it("strips /en locale prefix before comparing", () => {
    expect(isActive("/en/dashboard", "/dashboard")).toBe(true);
    expect(isActive("/en/library", "/library")).toBe(true);
  });

  // --- Without locale prefix ---
  it("works without locale prefix", () => {
    expect(isActive("/profile", "/profile")).toBe(true);
    expect(isActive("/favorites/characters", "/favorites/characters")).toBe(true);
  });

  // --- Locale-only path normalises to "/" ---
  it("normalises locale-only pathname to /", () => {
    expect(isActive("/fr", "/")).toBe(true);
    expect(isActive("/en", "/")).toBe(true);
  });

  // --- currentUserId: own profile redirect ---
  it("activates /profile instead of /players when viewing own player page", () => {
    const userId = "abc-123";
    expect(isActive("/players/abc-123", "/profile", userId)).toBe(true);
    expect(isActive("/players/abc-123", "/players", userId)).toBe(false);
  });

  it("activates /players for another user's player page", () => {
    const userId = "abc-123";
    expect(isActive("/players/other-456", "/players", userId)).toBe(true);
    expect(isActive("/players/other-456", "/profile", userId)).toBe(false);
  });

  it("handles own profile with locale prefix", () => {
    const userId = "abc-123";
    expect(isActive("/fr/players/abc-123", "/profile", userId)).toBe(true);
    expect(isActive("/fr/players/abc-123", "/players", userId)).toBe(false);
  });

  it("handles own profile sub-path", () => {
    const userId = "abc-123";
    expect(isActive("/players/abc-123/stats", "/profile", userId)).toBe(true);
    expect(isActive("/players/abc-123/stats", "/players", userId)).toBe(false);
  });
});
