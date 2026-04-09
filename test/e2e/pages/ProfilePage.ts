import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the personal profile / settings page.
 */
export class ProfilePage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/profile`);
  }

  async gotoSettings(locale: string = "fr") {
    await this.navigateTo(`/${locale}/settings`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get usernameInput(): Locator {
    return this.page.getByRole("textbox", { name: /username|pseudo|nom/i });
  }

  get emailInput(): Locator {
    return this.page.getByRole("textbox", { name: /email/i });
  }

  get avatarUpload(): Locator {
    return this.page.locator('input[type="file"]').first();
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /sauvegarder|save|enregistrer/i });
  }
}
