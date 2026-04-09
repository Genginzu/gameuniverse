import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the reviews section on a game detail page.
 */
export class ReviewSection extends BasePage {
  get section(): Locator {
    return this.page.locator('[class*="review"], [data-testid*="review"]').first();
  }

  get reviews(): Locator {
    return this.page.locator('[class*="review-item"], [data-testid*="review-item"]');
  }

  get writeReviewButton(): Locator {
    return this.page.getByRole("button", { name: /écrire|write|avis|review/i }).first();
  }

  get ratingInput(): Locator {
    return this.page.locator('[class*="rating"], [data-testid*="rating"]').first();
  }

  get reviewTextarea(): Locator {
    return this.page.getByRole("textbox").or(this.page.locator("textarea")).first();
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: /publier|submit|envoyer|send/i }).first();
  }

  get voteButtons(): Locator {
    return this.page.locator('[class*="vote"], [data-testid*="vote"]');
  }
}
