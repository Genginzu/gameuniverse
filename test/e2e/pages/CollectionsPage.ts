import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the collections listing page.
 */
export class CollectionsPage extends BasePage {
  async goto(locale: string, playerId: string) {
    await this.navigateTo(`/${locale}/players/${playerId}/collections`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get collectionCards(): Locator {
    return this.page.locator('a[href*="/collections/"]').filter({ hasText: /.+/ });
  }

  get createButton(): Locator {
    return this.page.getByRole("button", { name: /créer|create|nouvelle|new/i });
  }

  get emptyState(): Locator {
    return this.page.locator('[class*="empty"], [data-testid*="empty"]').first();
  }
}
