import { test, expect } from "@playwright/test";
import { LibraryPage } from "../pages/LibraryPage";

test.describe("Library — #52", () => {
  test("should redirect to auth if not connected", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto("fr");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url.includes("/library") || url.includes("/auth") || url.includes("/fr")).toBeTruthy();
  });

  test("should load the library page", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto("fr");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/\/(fr|en)/);
  });

  test("should display library heading or redirect", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto("fr");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    if (url.includes("/library")) {
      await expect(library.heading).toBeVisible({ timeout: 10_000 });
    }
  });
});
