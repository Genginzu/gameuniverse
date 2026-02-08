import { describe, it, expect } from "bun:test";
import { Input } from "../../../../src/components/ui/input";

describe("Input component", () => {
  describe("component export", () => {
    it("should export Input component", () => {
      expect(Input).toBeDefined();
    });

    it("should have displayName", () => {
      expect(Input.displayName).toBe("Input");
    });

    it("should be a forwardRef component", () => {
      // forwardRef components have $$typeof property
      expect(Input).toHaveProperty("$$typeof");
    });
  });

  describe("component structure", () => {
    it("should be a valid React component", () => {
      expect(typeof Input).toBe("object");
      expect(Input.$$typeof).toBeDefined();
    });
  });
});
