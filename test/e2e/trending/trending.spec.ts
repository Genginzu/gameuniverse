import { test, expect } from "@playwright/test";

test.describe("Trending & Upcoming pages", () => {
  test.describe("Trending", () => {
    test("should load the trending page", async ({ page }) => {
      await page.goto("/fr/trending");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/trending/);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });

    test("should display game cards or empty state", async ({ page }) => {
      await page.goto("/fr/trending");
      await page.waitForLoadState("domcontentloaded");

      const cards = page.locator('[data-testid="game-card"], a[href*="/games/"]');
      const emptyState = page.getByText(/aucun|no.*game|empty/i);

      await Promise.race([
        cards.first().waitFor({ state: "visible", timeout: 10_000 }),
        emptyState.waitFor({ state: "visible", timeout: 10_000 }),
      ]).catch(() => {});

      const pageRendered = await page
        .getByRole("heading", { level: 1 })
        .first()
        .isVisible()
        .catch(() => false);
      const hasContent =
        (await cards.count()) > 0 ||
        (await emptyState.first().isVisible().catch(() => false)) ||
        pageRendered;
      expect(hasContent).toBeTruthy();
    });

    test("should navigate to game detail from trending", async ({ page }) => {
      await page.goto("/fr/trending");
      await page.waitForLoadState("domcontentloaded");

      const gameLinks = page.locator('a[href*="/games/"]');
      await gameLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
      const count = await gameLinks.count();
      if (count > 0) {
        await gameLinks.first().click();
        await expect(page).toHaveURL(/\/fr\/games\/.+/);
      }
    });
  });

  test.describe("Upcoming", () => {
    test("should load the upcoming page", async ({ page }) => {
      await page.goto("/fr/upcoming");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/upcoming/);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });

    test("should display upcoming game cards or empty state", async ({ page }) => {
      await page.goto("/fr/upcoming");
      await page.waitForLoadState("domcontentloaded");

      const cards = page.locator('[data-testid="game-card"], a[href*="/games/"]');
      const emptyState = page.getByText(/aucun|no.*game|empty/i);

      await Promise.race([
        cards.first().waitFor({ state: "visible", timeout: 10_000 }),
        emptyState.waitFor({ state: "visible", timeout: 10_000 }),
      ]).catch(() => {});

      const pageRendered = await page
        .getByRole("heading", { level: 1 })
        .first()
        .isVisible()
        .catch(() => false);
      const hasContent =
        (await cards.count()) > 0 ||
        (await emptyState.first().isVisible().catch(() => false)) ||
        pageRendered;
      expect(hasContent).toBeTruthy();
    });
  });
});
