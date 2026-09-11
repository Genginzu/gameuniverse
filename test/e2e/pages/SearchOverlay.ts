import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the global search overlay/dropdown.
 */
export class SearchOverlay extends BasePage {
  get trigger(): Locator {
    return this.page.locator('[data-testid="header-search-trigger"]');
  }

  get input(): Locator {
    return this.page.locator('[data-testid="search-overlay-input"]');
  }

  get results(): Locator {
    return this.page.locator(
      '[data-testid="search-overlay"] [class*="search-result"], [data-testid="search-overlay"] [class*="dropdown"] a'
    );
  }

  get emptyState(): Locator {
    return this.page
      .locator('[data-testid="search-overlay"] [class*="empty"], [data-testid="search-overlay"] [data-testid*="empty"]')
      .first();
  }

  async open() {
    await this.trigger.click();
  }

  async search(query: string) {
    await this.input.fill(query);
    // The search hook has a 300ms debounce — wait for it to fire before
    // checking for network idle, otherwise networkidle resolves before
    // the search request is even sent.
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState("networkidle");
  }

  async clickFirstResult() {
    await this.results.first().click();
  }
}
