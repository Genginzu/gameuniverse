import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for authentication pages (login, register, forgot-password, reset-password).
 */
export class AuthPage extends BasePage {
  async gotoLogin(locale: string = "fr") {
    await this.navigateTo(`/${locale}/auth?mode=signin`);
  }

  async gotoRegister(locale: string = "fr") {
    await this.navigateTo(`/${locale}/auth?mode=signup`);
  }

  async gotoForgotPassword(locale: string = "fr") {
    await this.navigateTo(`/${locale}/auth/forgot-password`);
  }

  async gotoResetPassword(locale: string = "fr") {
    await this.navigateTo(`/${locale}/auth/reset-password`);
  }

  get emailInput(): Locator {
    return this.page.getByRole("textbox", { name: /email/i });
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]').first();
  }

  get usernameInput(): Locator {
    return this.page.getByRole("textbox", { name: /username|pseudo|nom/i });
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", {
      name: /connexion|sign in|inscription|sign up|envoyer|send/i,
    });
  }

  get forgotPasswordLink(): Locator {
    return this.page.getByRole("link", { name: /mot de passe oublié|forgot password/i });
  }

  get switchModeLink(): Locator {
    return this.page.getByRole("button", { name: /créer un compte|sign up|se connecter|sign in/i });
  }

  get errorMessage(): Locator {
    return this.page.locator('[role="alert"], .text-red-500, .text-destructive').first();
  }

  get form(): Locator {
    return this.page.locator("form").first();
  }

  async fillLogin(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillRegister(email: string, password: string, username?: string) {
    if (username) {
      await this.usernameInput.fill(username);
    }
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }
}
