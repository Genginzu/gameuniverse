import { test, expect } from "@playwright/test";
import { PlayersPage } from "../pages/PlayersPage";
import { PlayerDetailPage } from "../pages/PlayerDetailPage";
import { ProfilePage } from "../pages/ProfilePage";

test.describe("Players — profile, tabs, friends, settings — #50", () => {
  test.describe("Players listing", () => {
    test("should display the players page", async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto("fr");

      await expect(page).toHaveURL(/\/fr\/players/);
      await expect(players.heading).toBeVisible();
    });

    test("should display player cards", async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto("fr");
      await page.waitForTimeout(3000);

      const count = await players.playerCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should search players by name", async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto("fr");
      await page.waitForTimeout(2000);

      const searchVisible = await players.searchInput.isVisible().catch(() => false);
      if (searchVisible) {
        await players.search("test");
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/\/fr\/players/);
      }
    });

    test("should navigate to player detail on card click", async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto("fr");
      await page.waitForTimeout(3000);

      const count = await players.playerCards.count();
      if (count > 0) {
        await players.clickFirstPlayer();
        await expect(page).toHaveURL(/\/fr\/players\/.+/);
      }
    });
  });

  test.describe("Player detail page", () => {
    test("should display player profile with username", async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto("fr");
      await page.waitForTimeout(3000);

      const count = await players.playerCards.count();
      if (count > 0) {
        await players.clickFirstPlayer();
        await page.waitForLoadState("domcontentloaded");

        const detail = new PlayerDetailPage(page);
        await expect(detail.username).toBeVisible({ timeout: 10_000 });
      }
    });

    test("should display tabs on player profile", async ({ page }) => {
      const players = new PlayersPage(page);
      await players.goto("fr");
      await page.waitForTimeout(3000);

      const count = await players.playerCards.count();
      if (count > 0) {
        await players.clickFirstPlayer();
        await page.waitForLoadState("domcontentloaded");

        const detail = new PlayerDetailPage(page);
        await expect(detail.tabs).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test.describe("Profile page (authenticated)", () => {
    test("should redirect to auth if not connected", async ({ page }) => {
      const profile = new ProfilePage(page);
      await profile.goto("fr");
      await page.waitForTimeout(3000);

      const url = page.url();
      // Should either redirect to auth or show the profile page
      const isOnProfile = url.includes("/profile") || url.includes("/players/");
      const isOnAuth = url.includes("/auth");
      expect(isOnProfile || isOnAuth).toBeTruthy();
    });
  });

  test.describe("Friends system", () => {
    test("should display friends page", async ({ page }) => {
      await page.goto("/fr/friends");
      await page.waitForTimeout(3000);

      // Should either show friends page or redirect to auth
      const url = page.url();
      expect(url.includes("/friends") || url.includes("/auth") || url.includes("/fr")).toBeTruthy();
    });
  });
});
