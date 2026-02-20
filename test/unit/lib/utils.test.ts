import { describe, it, expect } from "vitest";
import { cn } from "../../../src/lib/utils";

describe("cn utility function", () => {
  describe("basic class merging", () => {
    it("should return empty string for no arguments", () => {
      expect(cn()).toBe("");
    });

    it("should return single class unchanged", () => {
      expect(cn("text-red-500")).toBe("text-red-500");
    });

    it("should merge multiple classes", () => {
      expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });

    it("should handle undefined values", () => {
      expect(cn("text-red-500", undefined, "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });

    it("should handle null values", () => {
      expect(cn("text-red-500", null, "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });

    it("should handle false values", () => {
      expect(cn("text-red-500", false, "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });

    it("should handle empty strings", () => {
      expect(cn("text-red-500", "", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });
  });

  describe("Tailwind class conflict resolution", () => {
    it("should resolve conflicting padding classes", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("should resolve conflicting margin classes", () => {
      expect(cn("m-4", "m-2")).toBe("m-2");
    });

    it("should resolve conflicting text color classes", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should resolve conflicting background color classes", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should resolve conflicting width classes", () => {
      expect(cn("w-full", "w-1/2")).toBe("w-1/2");
    });

    it("should resolve conflicting height classes", () => {
      expect(cn("h-10", "h-12")).toBe("h-12");
    });

    it("should keep non-conflicting classes", () => {
      expect(cn("p-4", "m-2", "text-red-500")).toBe("p-4 m-2 text-red-500");
    });
  });

  describe("conditional classes", () => {
    it("should handle conditional object syntax", () => {
      expect(cn({ "text-red-500": true, "bg-blue-500": false })).toBe("text-red-500");
    });

    it("should handle mixed conditional and string classes", () => {
      expect(cn("p-4", { "text-red-500": true, "bg-blue-500": false })).toBe("p-4 text-red-500");
    });

    it("should handle array of classes", () => {
      expect(cn(["text-red-500", "bg-blue-500"])).toBe("text-red-500 bg-blue-500");
    });

    it("should handle nested arrays", () => {
      expect(cn(["text-red-500", ["bg-blue-500", "p-4"]])).toBe("text-red-500 bg-blue-500 p-4");
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace in class names", () => {
      expect(cn("  text-red-500  ", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });

    it("should handle multiple spaces between classes", () => {
      expect(cn("text-red-500   bg-blue-500")).toBe("text-red-500 bg-blue-500");
    });

    it("should handle complex Tailwind classes", () => {
      expect(cn("hover:bg-red-500", "focus:ring-2")).toBe("hover:bg-red-500 focus:ring-2");
    });

    it("should handle responsive classes", () => {
      expect(cn("md:text-lg", "lg:text-xl")).toBe("md:text-lg lg:text-xl");
    });

    it("should resolve responsive class conflicts", () => {
      expect(cn("md:p-4", "md:p-2")).toBe("md:p-2");
    });
  });
});
