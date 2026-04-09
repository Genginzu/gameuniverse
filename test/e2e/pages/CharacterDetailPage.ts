import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the character detail page.
 */
export class CharacterDetailPage extends BasePage {
  async goto(locale: string, slug: string) {
    await this.navigateTo(`/${locale}/characters/${slug}`);
  }

  get title(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get description(): Locator {
    return this.page.locator('[class*="description"]').first();
  }

  get favoriteButton(): Locator {
    return this.page.getByRole("button", { name: /favori|favorite|❤/i }).first();
  }

  get commentsSection(): Locator {
    return this.page.locator('[class*="comment"], [data-testid*="comment"]').first();
  }

  get image(): Locator {
    return this.page.locator("img[alt]").first();
  }

  get associatedGames(): Locator {
    return this.page.locator('a[href*="/games/"]');
  }
}
