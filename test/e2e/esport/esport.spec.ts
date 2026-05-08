import { test, expect } from "@playwright/test";

test.describe("Esport — calendar, live, teams, players, results", () => {
  test.describe("Esport tournaments", () => {
    test("should load the esport tournaments page", async ({ page }) => {
      await page.goto("/fr/esport/tournaments");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/esport\/tournaments/);
      const title = page.getByTestId("page-banner-title");
      await expect(title).toBeVisible({ timeout: 10_000 });
    });

    test("should display tournament cards or empty state", async ({ page }) => {
      await page.goto("/fr/esport/tournaments");
      await page.waitForLoadState("domcontentloaded");

      const cards = page.locator('[data-testid="tournament-card"], [class*="card"]');
      const emptyState = page.getByText(/aucun.*tournoi|no.*tournament/i).first();

      await Promise.race([
        cards.first().waitFor({ state: "visible", timeout: 10_000 }),
        emptyState.waitFor({ state: "visible", timeout: 10_000 }),
      ]).catch(() => {});

      const hasContent = (await cards.count()) > 0 || (await emptyState.isVisible());
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("Esport live", () => {
    test("should load the live page", async ({ page }) => {
      await page.goto("/fr/esport/live");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/esport\/live/);
      const title = page.getByTestId("page-banner-title");
      await expect(title).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Esport teams", () => {
    test("should load the teams listing page", async ({ page }) => {
      await page.goto("/fr/esport/teams");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/esport\/teams/);
      const title = page.getByTestId("page-banner-title");
      await expect(title).toBeVisible({ timeout: 10_000 });
    });

    test("should display team cards or empty state", async ({ page }) => {
      await page.goto("/fr/esport/teams");
      await page.waitForLoadState("domcontentloaded");

      const cards = page.locator('[data-testid="team-card"], [class*="card"]');
      const emptyState = page.getByRole("heading", { name: /aucune.*équipe/i });

      await Promise.race([
        cards.first().waitFor({ state: "visible", timeout: 10_000 }),
        emptyState.waitFor({ state: "visible", timeout: 10_000 }),
      ]).catch(() => {});

      const hasContent = (await cards.count()) > 0 || (await emptyState.isVisible());
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe("Esport players", () => {
    test("should load the esport players page", async ({ page }) => {
      await page.goto("/fr/esport/players");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/esport\/players/);
      const title = page.getByTestId("page-banner-title");
      await expect(title).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Esport results", () => {
    test("should load the results page", async ({ page }) => {
      await page.goto("/fr/esport/results");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/fr\/esport\/results/);
      const title = page.getByTestId("page-banner-title");
      await expect(title).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Esport predictions", () => {
    test("should load the predictions page or redirect to auth", async ({ page }) => {
      await page.goto("/fr/esport/predictions");
      await page.waitForLoadState("domcontentloaded");

      const url = page.url();
      expect(
        url.includes("/esport/predictions") || url.includes("/auth")
      ).toBeTruthy();
    });
  });

  test.describe("Esport fantasy", () => {
    test("should load the fantasy page or redirect to auth", async ({ page }) => {
      await page.goto("/fr/esport/fantasy");
      await page.waitForLoadState("domcontentloaded");

      const url = page.url();
      expect(
        url.includes("/esport/fantasy") || url.includes("/auth")
      ).toBeTruthy();
    });
  });
});
