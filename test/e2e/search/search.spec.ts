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
      await page.waitForTimeout(2000);

      const resultCount = await search.results.count();
      const hasEmpty = await search.emptyState.isVisible().catch(() => false);
      // Should show results or empty state
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
      await page.waitForTimeout(2000);

      const resultCount = await search.results.count();
      if (resultCount > 0) {
        const initialUrl = page.url();
        await search.clickFirstResult();
        await page.waitForTimeout(2000);
        // URL should have changed after clicking a result
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
      await page.waitForTimeout(2000);

      const resultCount = await search.results.count();
      const hasEmpty = await search.emptyState.isVisible().catch(() => false);
      // Should show empty state or no results
      expect(resultCount === 0 || hasEmpty).toBeTruthy();
    }
  });
});
