import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the admin game creation/edit form.
 */
export class AdminGameFormPage extends BasePage {
  async gotoNew(locale: string = "fr") {
    await this.navigateTo(`/${locale}/admin/games/new`);
  }

  async gotoEdit(locale: string, id: string) {
    await this.navigateTo(`/${locale}/admin/games/${id}/edit`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get form(): Locator {
    return this.page.locator("form").first();
  }

  get tabs(): Locator {
    return this.page.getByRole("tablist").or(this.page.locator('[class*="tab"]')).first();
  }

  get saveButton(): Locator {
    return this.page
      .getByRole("button", { name: /sauvegarder|save|enregistrer|créer|create/i })
      .first();
  }

  get cancelButton(): Locator {
    return this.page
      .getByRole("button", { name: /annuler|cancel/i })
      .or(this.page.getByRole("link", { name: /annuler|cancel|retour|back/i }))
      .first();
  }
}
