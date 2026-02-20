import { describe, it, expect } from "vitest";
import { LoadingSpinner } from "../../../../src/components/ui/loading-spinner";

describe("LoadingSpinner component", () => {
  describe("component export", () => {
    it("should export LoadingSpinner component", () => {
      expect(LoadingSpinner).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof LoadingSpinner).toBe("function");
    });

    it("should have correct function name", () => {
      expect(LoadingSpinner.name).toBe("LoadingSpinner");
    });
  });
});
