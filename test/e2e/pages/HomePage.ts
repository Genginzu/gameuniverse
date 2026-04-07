import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}`);
  }

  get heading() {
    return this.page.getByRole("heading", { level: 1 });
  }

  get navigation() {
    return this.page.getByRole("navigation");
  }
}
