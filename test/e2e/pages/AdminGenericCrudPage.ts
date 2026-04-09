import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Reusable Page Object for admin CRUD pages (genres, languages, roles, species, genders, companies, etc.).
 */
export class AdminGenericCrudPage extends BasePage {
  constructor(
    page: Page,
    private readonly entityPath: string
  ) {
    super(page);
  }

  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/admin/${this.entityPath}`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get createButton(): Locator {
    return this.page
      .getByRole("link", { name: /nouveau|new|créer|create|ajouter|add/i })
      .or(this.page.getByRole("button", { name: /nouveau|new|créer|create|ajouter|add/i }))
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
    return this.page
      .getByRole("button", { name: /modifier|edit/i })
      .or(this.page.locator('a[href*="/edit"], [class*="edit"]'));
  }

  get deleteButtons(): Locator {
    return this.page.getByRole("button", { name: /supprimer|delete/i });
  }

  get pagination(): Locator {
    return this.page.locator('nav[aria-label*="pagination"], [class*="pagination"]').first();
  }
}
