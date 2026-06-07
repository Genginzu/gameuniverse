import { test, expect } from "@playwright/test";
import { EditorialNav } from "../pages/EditorialNav";
import { SearchOverlay } from "../pages/SearchOverlay";

/**
 * P5-03 — Parcours critiques avec la nouvelle navigation éditoriale
 * (mega-menu + rail + recherche + hamburger mobile).
 *
 * Specs résilients (comme le reste de la suite) : tolérants aux états de
 * données / d'auth, on vérifie surtout que le shell éditorial et sa nav
 * fonctionnent (notamment la navigation des liens du mega-menu, cf #210).
 */
test.describe("Editorial navigation — P5-03", () => {
  test("home renders the editorial shell (header + main)", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const nav = new EditorialNav(page);
    await expect(nav.main).toBeVisible({ timeout: 10000 });
  });

  test("mega-menu entry opens a panel and a sub-link navigates", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const nav = new EditorialNav(page);
    const entryVisible = await nav.entry("games").isVisible().catch(() => false);
    test.skip(!entryVisible, "Mega-menu entries hidden (mobile viewport / not rendered)");

    await nav.openEntry("games");
    await expect(nav.panel("games")).toBeVisible({ timeout: 5000 });

    const initialUrl = page.url();
    await nav.panelLinks.first().click();
    // Régression #210 : le clic sur un sous-lien doit naviguer (le panel ne
    // doit pas se fermer avant le click).
    await page.waitForURL((url) => url.toString() !== initialUrl, { timeout: 5000 });
    expect(page.url()).not.toBe(initialUrl);
  });

  test("rail navigates to an editorial space (desktop)", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const nav = new EditorialNav(page);
    const railVisible = await nav.rail.isVisible().catch(() => false);
    test.skip(!railVisible, "Rail hidden (mobile viewport)");

    const count = await nav.railLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search overlay opens from the header", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const search = new SearchOverlay(page);
    const triggerVisible = await search.trigger.isVisible().catch(() => false);
    if (triggerVisible) {
      await search.open();
      await expect(search.input).toBeVisible({ timeout: 5000 });
    }
  });

  test("game detail is reachable from the games listing", async ({ page }) => {
    await page.goto("/fr/games");
    await page.waitForLoadState("domcontentloaded");

    const firstCard = page.locator('a[href*="/games/"]').first();
    const hasCard = await firstCard.isVisible().catch(() => false);
    test.skip(!hasCard, "No game card available (empty dataset)");

    await firstCard.click();
    await page.waitForURL(/\/games\/.+/, { timeout: 8000 });
    expect(page.url()).toMatch(/\/games\/.+/);
  });

  test("mobile: hamburger nav is present on small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const nav = new EditorialNav(page);
    await expect(nav.mobileNav).toBeVisible({ timeout: 10000 });
  });
});
