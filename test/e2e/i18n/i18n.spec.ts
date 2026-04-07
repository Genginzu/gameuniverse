import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("should load the French version by default", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/fr/);
  });

  test("should switch to English", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en/);
  });
});
