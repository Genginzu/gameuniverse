import { describe, it, expect } from "bun:test";

describe("Test Setup", () => {
  it("should have DOM globals available", () => {
    expect(global.window).toBeDefined();
    expect(global.document).toBeDefined();
    expect(global.navigator).toBeDefined();
  });

  it("should have mock router available", () => {
    const mockRouter = (global as any).mockRouter;
    expect(mockRouter).toBeDefined();
    expect(mockRouter.push).toBeDefined();
    expect(mockRouter.pathname).toBe("/");
  });

  it("should perform basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });
});
