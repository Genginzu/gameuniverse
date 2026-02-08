import { describe, it, expect } from "bun:test";
import { LoadingButton } from "../../../../src/components/ui/loading-button";

describe("LoadingButton component", () => {
  describe("component export", () => {
    it("should export LoadingButton component", () => {
      expect(LoadingButton).toBeDefined();
    });

    it("should have displayName", () => {
      expect(LoadingButton.displayName).toBe("LoadingButton");
    });

    it("should be a forwardRef component", () => {
      expect(LoadingButton).toHaveProperty("$$typeof");
    });
  });

  describe("component structure", () => {
    it("should be a valid React component", () => {
      expect(typeof LoadingButton).toBe("object");
      expect(LoadingButton.$$typeof).toBeDefined();
    });
  });
});
