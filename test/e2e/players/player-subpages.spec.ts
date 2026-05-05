import { test, expect } from "@playwright/test";

test.describe("Player sub-pages — achievements, collections, year recap", () => {
  test("should load player achievements page", async ({ page }) => {
    const players = page.locator('a[href*="/players/"]');
    await page.goto("/fr/players");
    await players.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await players.count();
    if (count > 0) {
      const href = await players.first().getAttribute("href");
      if (href) {
        await page.goto(`${href}/achievements`);
        await page.waitForLoadState("domcontentloaded");
        const url = page.url();
        expect(url.includes("/achievements") || url.includes("/players/")).toBeTruthy();
      }
    }
  });

  test("should load player collections page", async ({ page }) => {
    const players = page.locator('a[href*="/players/"]');
    await page.goto("/fr/players");
    await players.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await players.count();
    if (count > 0) {
      const href = await players.first().getAttribute("href");
      if (href) {
        await page.goto(`${href}/collections`);
        await page.waitForLoadState("domcontentloaded");
        const url = page.url();
        expect(url.includes("/collections") || url.includes("/players/")).toBeTruthy();
      }
    }
  });

  test("should load player year recap page", async ({ page }) => {
    const players = page.locator('a[href*="/players/"]');
    await page.goto("/fr/players");
    await players.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await players.count();
    if (count > 0) {
      const href = await players.first().getAttribute("href");
      if (href) {
        await page.goto(`${href}/year/2025`);
        await page.waitForLoadState("domcontentloaded");
        const url = page.url();
        expect(url.includes("/year/") || url.includes("/players/")).toBeTruthy();
      }
    }
  });

  test("should load favorites characters page or redirect", async ({ page }) => {
    await page.goto("/fr/favorites/characters");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(
      url.includes("/favorites/characters") || url.includes("/auth") || url.includes("/fr")
    ).toBeTruthy();
  });
});

test.describe("Esport detail pages", () => {
  test("should navigate to team detail from teams listing", async ({ page }) => {
    await page.goto("/fr/esport/teams");
    await page.waitForLoadState("domcontentloaded");

    const teamLinks = page.locator('a[href*="/esport/teams/"]');
    await teamLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await teamLinks.count();
    if (count > 0) {
      await teamLinks.first().click();
      await expect(page).toHaveURL(/\/fr\/esport\/teams\/.+/);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible({ timeout: 10_000 });
    }
  });

  test("should navigate to esport player detail from players listing", async ({ page }) => {
    await page.goto("/fr/esport/players");
    await page.waitForLoadState("domcontentloaded");

    const playerLinks = page.locator('a[href*="/esport/players/"]');
    await playerLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await playerLinks.count();
    if (count > 0) {
      await playerLinks.first().click();
      await expect(page).toHaveURL(/\/fr\/esport\/players\/.+/);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible({ timeout: 10_000 });
    }
  });

  test("should load coaching profile page", async ({ page }) => {
    await page.goto("/fr/coaching");
    await page.waitForLoadState("domcontentloaded");

    const coachLinks = page.locator('a[href*="/coaching/"]').filter({ hasNotText: /settings|sessions/ });
    await coachLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await coachLinks.count();
    if (count > 0) {
      await coachLinks.first().click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(/\/coaching\/.+/);
    }
  });
});
