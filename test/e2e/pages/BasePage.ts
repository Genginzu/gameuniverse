import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object Model — shared helpers for all page objects.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}
