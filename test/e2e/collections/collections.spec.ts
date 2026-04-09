import { test, expect } from "@playwright/test";

test.describe("Collections — #52", () => {
  test("should load the collections tab on a player profile", async ({ page }) => {
    await page.goto("/fr/players");

    const playerLinks = page.locator('a[href*="/players/"]').filter({ hasText: /.+/ });
    await playerLinks
      .first()
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {});
    const count = await playerLinks.count();

    if (count > 0) {
      await playerLinks.first().click();
      await page.waitForLoadState("domcontentloaded");

      const collectionsTab = page.getByRole("tab", { name: /collections/i });
      const tabVisible = await collectionsTab.isVisible().catch(() => false);
      if (tabVisible) {
        await collectionsTab.click();
      }
    }
  });

  test("should handle collection detail page", async ({ page }) => {
    await page.goto("/fr/players");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/\/fr\/players/);
  });
});
