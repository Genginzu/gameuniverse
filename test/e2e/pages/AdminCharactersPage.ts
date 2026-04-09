import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the admin characters management page.
 */
export class AdminCharactersPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/admin/characters`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  get newCharacterButton(): Locator {
    return this.page
      .getByRole("link", { name: /nouveau|new/i })
      .or(this.page.getByRole("button", { name: /nouveau|new/i }))
      .first();
  }

  get searchInput(): Locator {
    return this.page
      .getByRole("searchbox")
      .or(this.page.getByPlaceholder(/rechercher|search/i))
      .first();
  }

  get tableRows(): Locator {
    return this.page.locator("table tbody tr, [class*='table'] [class*='row']");
  }

  get editButtons(): Locator {
    return this.page.getByRole("button", { name: /modifier|edit/i });
  }

  get deleteButtons(): Locator {
    return this.page.getByRole("button", { name: /supprimer|delete/i });
  }
}
