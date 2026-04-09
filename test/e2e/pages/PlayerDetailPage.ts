import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the player detail page with tabs.
 */
export class PlayerDetailPage extends BasePage {
  async goto(locale: string, id: string) {
    await this.navigateTo(`/${locale}/players/${id}`);
  }

  get username(): Locator {
    return this.page
      .getByRole("heading", { level: 1 })
      .or(this.page.locator('[class*="username"]'))
      .first();
  }

  get avatar(): Locator {
    return this.page.locator('img[alt*="avatar" i], img[class*="avatar"]').first();
  }

  get banner(): Locator {
    return this.page.locator('[class*="banner"]').first();
  }

  get tabs(): Locator {
    return this.page.locator('[role="tab"]').first();
  }

  getTab(name: string): Locator {
    return this.page.getByRole("tab", { name: new RegExp(name, "i") });
  }

  get statsTab(): Locator {
    return this.getTab("stats|statistiques");
  }

  get reviewsTab(): Locator {
    return this.getTab("reviews|avis");
  }

  get postsTab(): Locator {
    return this.getTab("posts|publications");
  }

  get collectionsTab(): Locator {
    return this.getTab("collections");
  }

  get activityTab(): Locator {
    return this.getTab("activit|activity");
  }

  get friendButton(): Locator {
    return this.page.getByRole("button", { name: /ami|friend|ajouter|add/i }).first();
  }
}
