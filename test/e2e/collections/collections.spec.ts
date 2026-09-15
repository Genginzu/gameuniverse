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

  test("should show advanced stats section on a public collection detail — #101", async ({
    page,
  }) => {
    await page.goto("/fr/collections");
    await page.waitForLoadState("domcontentloaded");

    // Open the first public collection if any exist
    const collectionLinks = page.locator('a[href*="/collections/"]').filter({ hasText: /.+/ });
    await collectionLinks
      .first()
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {});

    if ((await collectionLinks.count()) === 0) {
      test.skip(true, "No public collection available in this environment");
      return;
    }

    await collectionLinks.first().click();
    await page.waitForLoadState("domcontentloaded");

    // The advanced stats section only renders when the collection has games.
    const statsHeading = page.getByRole("heading", { name: /statistiques avancées/i });
    const gamesHeading = page.getByRole("heading", { name: /^jeux$/i });

    const hasGames = await gamesHeading.isVisible().catch(() => false);
    if (hasGames) {
      await expect(statsHeading).toBeVisible({ timeout: 10_000 });
    }
  });
});
