import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the editorial navigation shell (mega-menu + rail +
 * sub-sidebar + mobile hamburger). Covers the F0-06/F0-07 components.
 */
export class EditorialNav extends BasePage {
  get header(): Locator {
    return this.getByTestId("editorial-layout-header");
  }

  get main(): Locator {
    return this.getByTestId("editorial-layout-main");
  }

  get logo(): Locator {
    return this.page.locator(".editorial-mega-menu-logo");
  }

  /** A mega-menu entry button (desktop), e.g. "games". */
  entry(key: "games" | "characters" | "players" | "esport"): Locator {
    return this.page.locator(`.editorial-mega-menu-entry[data-entry="${key}"]`);
  }

  /** The opened panel for an entry. */
  panel(key: string): Locator {
    return this.page.locator(`.editorial-mega-menu-panel[data-entry="${key}"]`);
  }

  /** Sub-links inside the mega-menu panels. */
  get panelLinks(): Locator {
    return this.page.locator(".editorial-mega-menu-link");
  }

  /** Left rail (desktop, >= lg). */
  get rail(): Locator {
    return this.page.locator(".editorial-layout-rail");
  }

  get railLinks(): Locator {
    return this.rail.locator("a, button");
  }

  /** Mobile hamburger nav container (visible < lg). */
  get mobileNav(): Locator {
    return this.page.locator(".editorial-layout-mobile-nav");
  }

  async openEntry(key: "games" | "characters" | "players" | "esport") {
    await this.entry(key).click();
  }
}
