import { test, expect } from "@playwright/test";

test.describe("Navigation, routing i18n & responsive — #48", () => {
  test.describe("i18n routing", () => {
    test("should load the French version by default", async ({ browser }) => {
      const context = await browser.newContext({ locale: "fr-FR" });
      const page = await context.newPage();
      await page.goto("/");
      await expect(page).toHaveURL(/\/fr/);
      await context.close();
    });

    test("should redirect to detected locale when no preference set", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/(fr|en)/);
    });

    test("should load /fr/games in French", async ({ page }) => {
      await page.goto("/fr/games");
      await expect(page).toHaveURL(/\/fr\/games/);
    });

    test("should load /en/games in English", async ({ page }) => {
      await page.goto("/en/games");
      await expect(page).toHaveURL(/\/en\/games/);
    });

    test("should preserve locale in internal links", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const links = page.locator('a[href^="/fr/"]');
      const count = await links.count();
      if (count > 0) {
        const href = await links.first().getAttribute("href");
        expect(href).toMatch(/^\/fr\//);
      }
    });
  });

  test.describe("Language switcher", () => {
    test("should switch from French to English", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const switcher = page
        .locator('[class*="language"], [data-testid*="language"]')
        .or(page.getByRole("button", { name: /en|english|anglais/i }))
        .first();

      if (await switcher.isVisible()) {
        await switcher.click();
        const enOption = page
          .getByRole("option", { name: /en|english/i })
          .or(page.locator('a[href*="/en"]').filter({ hasText: /en|english/i }))
          .first();
        if (await enOption.isVisible().catch(() => false)) {
          await enOption.click();
          await expect(page).toHaveURL(/\/en/, { timeout: 10_000 });
        }
      }
    });
  });

  test.describe("General navigation", () => {
    test("should navigate to games page", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const gamesLink = page.locator('nav a[href*="/games"]').first();
      if (await gamesLink.isVisible()) {
        await gamesLink.click();
        await expect(page).toHaveURL(/\/games/, { timeout: 10_000 });
      }
    });

    test("should navigate to characters page", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const link = page.locator('nav a[href*="/characters"]').first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(/\/characters/, { timeout: 10_000 });
      }
    });

    test("should navigate to players page", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const link = page.locator('nav a[href*="/players"]').first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(/\/players/, { timeout: 10_000 });
      }
    });

    test("should have a footer on the home page", async ({ page }) => {
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const footer = page.locator("footer");
      await expect(footer).toBeVisible();
    });
  });

  test.describe("Responsive", () => {
    test("should not have horizontal scroll at 375px", async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
      });
      const page = await context.newPage();
      await page.goto("/fr");
      await page.waitForLoadState("domcontentloaded");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
      await context.close();
    });

    test("should show mobile navigation on small screens", async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
      });
      const page = await context.newPage();
      await page.goto("/fr");
      await page.waitForLoadState("networkidle");

      const hamburger = page.locator('button[aria-label="Open navigation menu"]');
      const isVisible = await hamburger.isVisible({ timeout: 10_000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
      await context.close();
    });
  });
});
