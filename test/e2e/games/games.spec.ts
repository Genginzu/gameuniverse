import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

test.describe("Games page", () => {
  test("should load the games listing page", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto("fr");
    await expect(page).toHaveURL(/\/fr/);
  });
});
