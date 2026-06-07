import { test, expect } from "@playwright/test";

test.describe("Dashboard — home page & navigation", () => {
  test("should load the home page with main sections", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/\/fr/);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("should display navigation sidebar or header", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const nav = page.locator("nav");
    await expect(nav.first()).toBeVisible({ timeout: 10_000 });
  });

  test("should have links to main sections", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    // Les liens de section vivent dans les panneaux du méga-menu (masqués
    // tant qu'on ne survole pas) + dans le contenu de la home (hero). On ne
    // retient donc que les liens réellement visibles.
    const visibleSectionLinks = page.locator(
      'a[href*="/games"]:visible, a[href*="/characters"]:visible, a[href*="/players"]:visible'
    );

    await expect(visibleSectionLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test("should redirect /library to auth when not connected", async ({ page }) => {
    await page.goto("/fr/library");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url.includes("/library") || url.includes("/auth")).toBeTruthy();
  });

  test("should redirect /profile to auth when not connected", async ({ page }) => {
    await page.goto("/fr/profile");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url.includes("/profile") || url.includes("/auth")).toBeTruthy();
  });
});
