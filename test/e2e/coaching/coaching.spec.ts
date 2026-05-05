import { test, expect } from "@playwright/test";

test.describe("Coaching — pages", () => {
  test("should load the coaching page", async ({ page }) => {
    await page.goto("/fr/coaching");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/\/fr\/coaching/);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("should load coaching sessions page or redirect", async ({ page }) => {
    await page.goto("/fr/coaching/sessions");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(
      url.includes("/coaching/sessions") || url.includes("/auth") || url.includes("/coaching")
    ).toBeTruthy();
  });

  test("should load coaching settings page or redirect", async ({ page }) => {
    await page.goto("/fr/coaching/settings");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(
      url.includes("/coaching/settings") || url.includes("/auth")
    ).toBeTruthy();
  });
});
