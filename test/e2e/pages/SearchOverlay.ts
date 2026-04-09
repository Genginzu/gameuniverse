import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the global search overlay/dropdown.
 */
export class SearchOverlay extends BasePage {
  get trigger(): Locator {
    return this.page
      .locator('[data-testid*="search"], [class*="search-trigger"], button:has(svg)')
      .filter({ hasText: /rechercher|search/i })
      .first()
      .or(this.page.getByRole("button", { name: /rechercher|search/i }).first());
  }

  get input(): Locator {
    return this.page
      .getByRole("searchbox")
      .or(this.page.getByPlaceholder(/rechercher|search/i))
      .first();
  }

  get results(): Locator {
    return this.page.locator(
      '[class*="search-result"], [data-testid*="search-result"], [class*="dropdown"] a'
    );
  }

  get emptyState(): Locator {
    return this.page.locator('[class*="empty"], [data-testid*="empty"]').first();
  }

  async open() {
    await this.trigger.click();
  }

  async search(query: string) {
    await this.input.fill(query);
    await this.page.waitForLoadState("networkidle");
  }

  async clickFirstResult() {
    await this.results.first().click();
  }
}
