import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the admin games management page.
 */
export class AdminGamesPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/admin/games`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get newGameButton(): Locator {
    return this.page
      .getByRole("link", { name: /nouveau|new/i })
      .or(this.page.getByRole("button", { name: /nouveau|new/i }))
      .first();
  }

  get searchInput(): Locator {
    return this.page
      .getByRole("searchbox")
      .or(this.page.getByPlaceholder(/rechercher|search/i))
      .first();
  }

  get tableRows(): Locator {
    return this.page.locator("table tbody tr, [class*='table'] [class*='row']");
  }

  get editButtons(): Locator {
    return this.page
      .getByRole("button", { name: /modifier|edit/i })
      .or(this.page.locator('[class*="edit"]'));
  }

  get deleteButtons(): Locator {
    return this.page.getByRole("button", { name: /supprimer|delete/i });
  }

  get pagination(): Locator {
    return this.page.locator('nav[aria-label*="pagination"], [class*="pagination"]').first();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState("networkidle");
  }
}
