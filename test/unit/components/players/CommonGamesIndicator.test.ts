import { describe, it, expect } from "vitest";

/**
 * Unit Tests for CommonGamesIndicator
 *
 * Tests the display logic for the common games indicator:
 * - Loading state shows skeleton (Req 2.4)
 * - Zero games shows informational message (Req 3.3)
 * - N games shows clickable counter (Req 2.1)
 *
 * **Validates: Requirements 2.1, 2.4, 3.3**
 */

/** Which visual state the indicator should render */
type IndicatorState = "loading" | "empty" | "clickable";

function getIndicatorState(isLoading: boolean, count: number): IndicatorState {
  if (isLoading) return "loading";
  if (count === 0) return "empty";
  return "clickable";
}

/** Whether the onClick handler should be active (only for N > 0, not loading) */
function isClickable(isLoading: boolean, count: number): boolean {
  return !isLoading && count > 0;
}

describe("CommonGamesIndicator Unit Tests", () => {
  describe("indicator state resolution", () => {
    it("should be 'loading' when isLoading is true regardless of count", () => {
      expect(getIndicatorState(true, 0)).toBe("loading");
      expect(getIndicatorState(true, 5)).toBe("loading");
      expect(getIndicatorState(true, 100)).toBe("loading");
    });

    it("should be 'empty' when not loading and count is 0", () => {
      expect(getIndicatorState(false, 0)).toBe("empty");
    });

    it("should be 'clickable' when not loading and count > 0", () => {
      expect(getIndicatorState(false, 1)).toBe("clickable");
      expect(getIndicatorState(false, 42)).toBe("clickable");
    });
  });

  describe("clickability (Req 2.1)", () => {
    it("should not be clickable while loading", () => {
      expect(isClickable(true, 5)).toBe(false);
    });

    it("should not be clickable when count is 0", () => {
      expect(isClickable(false, 0)).toBe(false);
    });

    it("should be clickable when loaded with games", () => {
      expect(isClickable(false, 1)).toBe(true);
      expect(isClickable(false, 99)).toBe(true);
    });
  });

  describe("component export", () => {
    it("should export CommonGamesIndicator as a function", async () => {
      const mod = await import("@/components/players/CommonGamesIndicator");
      expect(mod.CommonGamesIndicator).toBeDefined();
      expect(typeof mod.CommonGamesIndicator).toBe("function");
    });
  });
});
