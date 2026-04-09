import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the comments section on a character detail page.
 */
export class CommentSection extends BasePage {
  get section(): Locator {
    return this.page.locator('[class*="comment"], [data-testid*="comment"]').first();
  }

  get comments(): Locator {
    return this.page.locator('[class*="comment-item"], [data-testid*="comment-item"]');
  }

  get textarea(): Locator {
    return this.page.getByRole("textbox").or(this.page.locator("textarea")).first();
  }

  get submitButton(): Locator {
    return this.page
      .getByRole("button", { name: /publier|submit|envoyer|send|commenter/i })
      .first();
  }

  get deleteButtons(): Locator {
    return this.page.locator('[class*="delete"], [data-testid*="delete"]');
  }
}
