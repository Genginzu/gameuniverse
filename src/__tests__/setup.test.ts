import { describe, it, expect } from "vitest";

describe("Test Setup", () => {
  it("should have DOM globals available", () => {
    expect(typeof global.window).toBe("object");
    expect(typeof global.document).toBe("object");
    expect(typeof global.navigator).toBe("object");
  });

  it("should perform basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });
});
