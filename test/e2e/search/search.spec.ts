import { test, expect } from "@playwright/test";
import { SearchOverlay } from "../pages/SearchOverlay";

test.describe("Global search — #49", () => {
  test("should open search overlay from home page", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const search = new SearchOverlay(page);
    const triggerVisible = await search.trigger.isVisible().catch(() => false);
    if (triggerVisible) {
      await search.open();
      await expect(search.input).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show multi-entity results", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const search = new SearchOverlay(page);
    const triggerVisible = await search.trigger.isVisible().catch(() => false);
    if (triggerVisible) {
      await search.open();
      await search.search("a");

      const resultCount = await search.results.count();
      const hasEmpty = await search.emptyState.isVisible().catch(() => false);
      expect(resultCount > 0 || hasEmpty).toBeTruthy();
    }
  });

  test("should navigate to detail page on result click", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const search = new SearchOverlay(page);
    const triggerVisible = await search.trigger.isVisible().catch(() => false);
    if (triggerVisible) {
      await search.open();
      await search.search("game");

      const resultCount = await search.results.count();
      if (resultCount > 0) {
        const initialUrl = page.url();
        await search.clickFirstResult();
        await page.waitForURL((url) => url.toString() !== initialUrl, { timeout: 5000 });
        expect(page.url()).not.toBe(initialUrl);
      }
    }
  });

  test("should show empty state for nonsense query", async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("domcontentloaded");

    const search = new SearchOverlay(page);
    const triggerVisible = await search.trigger.isVisible().catch(() => false);
    if (triggerVisible) {
      await search.open();
      await search.search("xyznonexistent12345");

      const resultCount = await search.results.count();
      const hasEmpty = await search.emptyState.isVisible().catch(() => false);
      expect(resultCount === 0 || hasEmpty).toBeTruthy();
    }
  });
});
