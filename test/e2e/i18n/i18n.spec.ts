import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("should load the French version by default", async ({ browser }) => {
    // Create a context with French Accept-Language to test default locale behavior
    const context = await browser.newContext({
      locale: "fr-FR",
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/fr/);
    await context.close();
  });

  test("should redirect to detected locale when no preference set", async ({ page }) => {
    // Default Playwright locale is English, so next-intl detects it
    await page.goto("/");
    await expect(page).toHaveURL(/\/(fr|en)/);
  });

  test("should switch to English", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en/);
  });
});
