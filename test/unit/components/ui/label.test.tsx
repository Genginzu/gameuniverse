import { describe, it, expect } from "bun:test";
import { Label } from "../../../../src/components/ui/label";

describe("Label component", () => {
  describe("component export", () => {
    it("should export Label component", () => {
      expect(Label).toBeDefined();
    });

    it("should have displayName", () => {
      expect(Label.displayName).toBeDefined();
    });

    it("should be a forwardRef component", () => {
      expect(Label).toHaveProperty("$$typeof");
    });
  });

  describe("component structure", () => {
    it("should be a valid React component", () => {
      expect(typeof Label).toBe("object");
      expect(Label.$$typeof).toBeDefined();
    });
  });
});
