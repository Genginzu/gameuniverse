import { describe, it, expect } from "bun:test";
import { GameUniverseLogo } from "../../../../src/components/ui/game-universe-logo";

describe("GameUniverseLogo component", () => {
  describe("component export", () => {
    it("should export GameUniverseLogo component", () => {
      expect(GameUniverseLogo).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof GameUniverseLogo).toBe("function");
    });

    it("should have correct function name", () => {
      expect(GameUniverseLogo.name).toBe("GameUniverseLogo");
    });
  });
});
