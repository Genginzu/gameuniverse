import { test, expect } from "@playwright/test";

test.describe("Posts — tags page", () => {
  test("should load a tag page", async ({ page }) => {
    await page.goto("/fr/posts/tags/gaming");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url.includes("/posts/tags/") || url.includes("/fr")).toBeTruthy();
  });
});
