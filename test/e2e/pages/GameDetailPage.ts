import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the game detail page.
 */
export class GameDetailPage extends BasePage {
  async goto(locale: string, slug: string) {
    await this.navigateTo(`/${locale}/games/${slug}`);
  }

  get title(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get description(): Locator {
    return this.page.locator('[class*="description"], [data-testid*="description"]').first();
  }

  get genres(): Locator {
    return this.page.locator('[class*="genre"], [data-testid*="genre"]');
  }

  get platforms(): Locator {
    return this.page.locator('[class*="platform"], [data-testid*="platform"]');
  }

  get addToLibraryButton(): Locator {
    return this.page.getByRole("button", { name: /ajouter|add|bibliothèque|library/i }).first();
  }

  get reviewsSection(): Locator {
    return this.page.locator('[class*="review"], [data-testid*="review"]').first();
  }

  get coverImage(): Locator {
    return this.page.locator("img[alt]").first();
  }
}
