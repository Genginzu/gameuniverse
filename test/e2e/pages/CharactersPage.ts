import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the public characters listing page.
 */
export class CharactersPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/characters`);
  }

  get heading(): Locator {
    return this.page.getByTestId("page-banner-title");
  }

  get characterCards(): Locator {
    return this.page.locator('a[href*="/characters/"]').filter({ hasText: /.+/ });
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

  get filterButtons(): Locator {
    return this.page.locator('[class*="filter"], [data-testid*="filter"]');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState("networkidle");
  }

  async clickFirstCharacter() {
    await this.characterCards.first().click();
  }
}
