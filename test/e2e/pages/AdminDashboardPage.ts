import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the admin dashboard (redirects to /admin/games).
 */
export class AdminDashboardPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/admin`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get sidebar(): Locator {
    return this.page.locator('[class*="sidebar"], nav').first();
  }

  get sidebarLinks(): Locator {
    return this.page.locator('nav a[href*="/admin/"]');
  }

  getSidebarLink(name: string): Locator {
    return this.page
      .locator(`nav a[href*="/admin/"]`)
      .filter({ hasText: new RegExp(name, "i") })
      .first();
  }
}
