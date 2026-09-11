import { describe, it, expect } from "bun:test";
import { IgdbFieldIndicator } from "../../../../../src/components/admin/games/IgdbFieldIndicator";

describe("IgdbFieldIndicator", () => {
  it("should export IgdbFieldIndicator component", () => {
    expect(IgdbFieldIndicator).toBeDefined();
    expect(typeof IgdbFieldIndicator).toBe("function");
  });

  it("should return null when isIgdbField is false", () => {
    // When isIgdbField is false, the component renders nothing
    // We verify the logic by checking the function exists and is callable
    const result = IgdbFieldIndicator({
      fieldName: "genres",
      isIgdbField: false,
    });
    expect(result).toBeNull();
  });

  it("should return a React element when isIgdbField is true", () => {
    // When isIgdbField is true, the component renders a span badge
    const result = IgdbFieldIndicator({
      fieldName: "genres",
      isIgdbField: true,
    });
    // Should return a valid React element (not null)
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
  });

  it("should return null for any field when isIgdbField is false", () => {
    const fields = [
      "translations",
      "cover_image",
      "background_image",
      "release_date",
      "metascore",
      "genres",
      "companies",
      "screenshots",
      "artworks",
      "age_ratings",
      "versions",
      "languages",
      "playtime",
    ] as const;

    for (const fieldName of fields) {
      const result = IgdbFieldIndicator({ fieldName, isIgdbField: false });
      expect(result).toBeNull();
    }
  });
});
