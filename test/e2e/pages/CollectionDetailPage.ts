import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for a single collection detail page.
 */
export class CollectionDetailPage extends BasePage {
  async goto(locale: string, slug: string) {
    await this.navigateTo(`/${locale}/collections/${slug}`);
  }

  get title(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get description(): Locator {
    return this.page.locator('[class*="description"]').first();
  }

  get gameCards(): Locator {
    return this.page.locator('a[href*="/games/"]').filter({ hasText: /.+/ });
  }

  get addGameButton(): Locator {
    return this.page.getByRole("button", { name: /ajouter|add/i }).first();
  }

  get editButton(): Locator {
    return this.page.getByRole("button", { name: /modifier|edit/i }).first();
  }

  get deleteButton(): Locator {
    return this.page.getByRole("button", { name: /supprimer|delete/i }).first();
  }
}
