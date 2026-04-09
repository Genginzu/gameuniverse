import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the favorites characters page.
 */
export class FavoritesPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/favorites/characters`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get favoriteCards(): Locator {
    return this.page.locator('a[href*="/characters/"]').filter({ hasText: /.+/ });
  }

  get emptyState(): Locator {
    return this.page.locator('[class*="empty"], [data-testid*="empty"]').first();
  }
}
