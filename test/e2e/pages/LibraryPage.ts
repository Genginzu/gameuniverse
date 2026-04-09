import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the user's game library page.
 */
export class LibraryPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/library`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get gameCards(): Locator {
    return this.page.locator('a[href*="/games/"]').filter({ hasText: /.+/ });
  }

  get searchInput(): Locator {
    return this.page
      .getByRole("searchbox")
      .or(this.page.getByPlaceholder(/rechercher|search/i))
      .first();
  }

  get filterButtons(): Locator {
    return this.page.locator('[class*="filter"], [data-testid*="filter"]');
  }

  get emptyState(): Locator {
    return this.page.locator('[class*="empty"], [data-testid*="empty"]').first();
  }

  get stats(): Locator {
    return this.page.locator('[class*="stat"], [data-testid*="stat"]').first();
  }
}
