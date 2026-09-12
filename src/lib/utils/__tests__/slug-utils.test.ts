import { describe, it, expect } from "vitest";
import { generateSlugFromTitle } from "@/lib/utils/slug-utils";

describe("generateSlugFromTitle", () => {
  it("converts basic string to slug", () => {
    expect(generateSlugFromTitle("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(generateSlugFromTitle("Game: The Sequel!")).toBe("game-the-sequel");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(generateSlugFromTitle("a  b--c")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(generateSlugFromTitle("-hello-")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(generateSlugFromTitle("")).toBe("");
  });

  it("returns same value for already valid slug", () => {
    expect(generateSlugFromTitle("hello-world")).toBe("hello-world");
  });
});
