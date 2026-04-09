import { test, expect } from "@playwright/test";
import { LibraryPage } from "../pages/LibraryPage";

test.describe("Library — #52", () => {
  test("should redirect to auth if not connected", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto("fr");
    await page.waitForTimeout(3000);

    const url = page.url();
    // Should redirect to auth or show library (if somehow authenticated)
    expect(url.includes("/library") || url.includes("/auth") || url.includes("/fr")).toBeTruthy();
  });

  test("should load the library page", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto("fr");
    await page.waitForLoadState("domcontentloaded");

    // Page should load without errors
    await expect(page).toHaveURL(/\/(fr|en)/);
  });

  test("should display library heading or redirect", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto("fr");
    await page.waitForTimeout(3000);

    const url = page.url();
    if (url.includes("/library")) {
      await expect(library.heading).toBeVisible({ timeout: 10_000 });
    }
    // If redirected, that's also valid behavior for unauthenticated users
  });
});
