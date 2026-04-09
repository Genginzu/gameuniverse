import { test as base, type Page } from "@playwright/test";

/**
 * Authentication states for E2E tests.
 *
 * Usage:
 *   import { test } from "../fixtures/auth.fixture";
 *   test("my test", async ({ authenticatedPage }) => { ... });
 */

type AuthFixtures = {
  /** Page with no authentication (visitor) */
  guestPage: Page;
  /** Page authenticated as a regular user */
  authenticatedPage: Page;
  /** Page authenticated as an admin user */
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  guestPage: async ({ page }, use) => {
    await use(page);
  },

  authenticatedPage: async ({ page }, use) => {
    // TODO: implement real Supabase auth login
    // Option 1: use storageState from a saved auth session
    // Option 2: programmatic login via Supabase client
    await page.goto("/");
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    // TODO: implement admin auth login
    await page.goto("/");
    await use(page);
  },
});

export { expect } from "@playwright/test";
