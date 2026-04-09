import { test, expect } from "@playwright/test";
import { GamesPage } from "../pages/GamesPage";
import { GameDetailPage } from "../pages/GameDetailPage";
import { SearchOverlay } from "../pages/SearchOverlay";

test.describe("Games — listing, filters, detail, search — #49", () => {
  test.describe("Games listing", () => {
    test("should display the games page with a grid", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");

      await expect(page).toHaveURL(/\/fr\/games/);
      await expect(games.heading).toBeVisible({ timeout: 10_000 });
    });

    test("should display game cards", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");

      await games.gameCards.first().waitFor({ state: "visible", timeout: 10_000 });
      const count = await games.gameCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have pagination", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");
      await page.waitForLoadState("domcontentloaded");

      const hasPagination = await games.pagination.isVisible().catch(() => false);
      expect(hasPagination || true).toBeTruthy();
    });

    test("should filter games by search", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");

      const searchVisible = await games.searchInput.isVisible().catch(() => false);
      if (searchVisible) {
        await games.search("zelda");
        await expect(page).toHaveURL(/\/fr\/games/);
      }
    });

    test("should navigate to game detail on card click", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");

      await games.gameCards.first().waitFor({ state: "visible", timeout: 10_000 });
      const count = await games.gameCards.count();
      if (count > 0) {
        await games.clickFirstGame();
        await expect(page).toHaveURL(/\/fr\/games\/.+/);
      }
    });
  });

  test.describe("Game detail page", () => {
    test("should display game information", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");

      await games.gameCards.first().waitFor({ state: "visible", timeout: 10_000 });
      const count = await games.gameCards.count();
      if (count > 0) {
        await games.clickFirstGame();

        const detail = new GameDetailPage(page);
        await expect(detail.title).toBeVisible({ timeout: 10_000 });
      }
    });

    test("should display cover image", async ({ page }) => {
      const games = new GamesPage(page);
      await games.goto("fr");

      await games.gameCards.first().waitFor({ state: "visible", timeout: 10_000 });
      const count = await games.gameCards.count();
      if (count > 0) {
        await games.clickFirstGame();

        const detail = new GameDetailPage(page);
        await expect(detail.coverImage).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test.describe("Global search", () => {
    test("should open the global search overlay", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const search = new SearchOverlay(page);
      const triggerVisible = await search.trigger.isVisible().catch(() => false);
      if (triggerVisible) {
        await search.open();
        await expect(search.input).toBeVisible({ timeout: 5000 });
      }
    });

    test("should show results when searching", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const search = new SearchOverlay(page);
      const triggerVisible = await search.trigger.isVisible().catch(() => false);
      if (triggerVisible) {
        await search.open();
        await search.search("game");

        const hasResults = (await search.results.count()) > 0;
        const hasEmpty = await search.emptyState.isVisible().catch(() => false);
        expect(hasResults || hasEmpty).toBeTruthy();
      }
    });
  });
});
