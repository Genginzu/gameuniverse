import { describe, it, expect } from "bun:test";
import { Skeleton } from "../../../../src/components/ui/skeleton";

describe("Skeleton component", () => {
  describe("component export", () => {
    it("should export Skeleton component", () => {
      expect(Skeleton).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof Skeleton).toBe("function");
    });

    it("should have correct function name", () => {
      expect(Skeleton.name).toBe("Skeleton");
    });
  });
});
