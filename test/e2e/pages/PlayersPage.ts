import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the players listing page.
 */
export class PlayersPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/players`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get playerCards(): Locator {
    return this.page.locator('a[href*="/players/"]').filter({ hasText: /.+/ });
  }

  get searchInput(): Locator {
    return this.page
      .getByRole("searchbox")
      .or(this.page.getByPlaceholder(/rechercher|search/i))
      .first();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState("networkidle");
  }

  async clickFirstPlayer() {
    await this.playerCards.first().click();
  }
}
