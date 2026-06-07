import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the public games listing page.
 */
export class GamesPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/games`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get gameCards(): Locator {
    return this.page
      .locator('[class*="game"], [data-testid*="game-card"], a[href*="/games/"]')
      .filter({ hasText: /.+/ });
  }

  get searchInput(): Locator {
    return this.page
      .getByRole("searchbox")
      .or(this.page.getByPlaceholder(/rechercher|search/i))
      .first();
  }

  get pagination(): Locator {
    return this.page.locator('nav[aria-label*="pagination"], [class*="pagination"]').first();
  }

  get nextPageButton(): Locator {
    return this.page
      .getByRole("button", { name: /suivant|next|→/i })
      .or(this.page.locator('[aria-label*="next"], [aria-label*="suivant"]'))
      .first();
  }

  get previousPageButton(): Locator {
    return this.page
      .getByRole("button", { name: /précédent|previous|←/i })
      .or(this.page.locator('[aria-label*="previous"], [aria-label*="précédent"]'))
      .first();
  }

  get filterButtons(): Locator {
    return this.page.locator('[class*="filter"], [data-testid*="filter"]');
  }

  get resetFiltersButton(): Locator {
    return this.page.getByRole("button", { name: /réinitialiser|reset|clear/i });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState("networkidle");
  }

  async clickFirstGame() {
    await this.gameCards.first().click();
  }
}
