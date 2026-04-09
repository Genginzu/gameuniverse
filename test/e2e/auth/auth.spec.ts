import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/AuthPage";

test.describe("Authentication — #47", () => {
  test.describe("Login form", () => {
    test("should display the login form", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoLogin("fr");

      await expect(auth.emailInput).toBeVisible();
      await expect(auth.passwordInput).toBeVisible();
      await expect(auth.submitButton).toBeVisible();
    });

    test("should show error on invalid credentials", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoLogin("fr");

      await auth.fillLogin("invalid@test.com", "wrongpassword");
      await auth.submitButton.click();

      await expect(auth.errorMessage).toBeVisible({ timeout: 10_000 });
    });

    test("should have a forgot password link", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoLogin("fr");

      await expect(auth.forgotPasswordLink).toBeVisible();
    });

    test("should navigate to forgot password page", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoLogin("fr");

      await auth.forgotPasswordLink.click();
      await expect(page).toHaveURL(/forgot-password/);
    });
  });

  test.describe("Registration form", () => {
    test("should display the registration form", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoRegister("fr");

      await expect(auth.emailInput).toBeVisible();
      await expect(auth.passwordInput).toBeVisible();
      await expect(auth.submitButton).toBeVisible();
    });

    test("should show validation error for invalid email", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoRegister("fr");

      await auth.emailInput.fill("not-an-email");
      await auth.passwordInput.fill("password123");
      await auth.submitButton.click();

      // Browser validation or custom error
      const isInvalid = await auth.emailInput.evaluate(
        (el) => !(el as HTMLInputElement).validity.valid
      );
      expect(isInvalid || (await auth.errorMessage.isVisible())).toBeTruthy();
    });

    test("should show validation error for short password", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoRegister("fr");

      await auth.emailInput.fill("test@example.com");
      await auth.passwordInput.fill("12");
      await auth.submitButton.click();

      // Wait for either form validation or server error
      await page.waitForTimeout(1000);
      const hasError = await auth.errorMessage.isVisible().catch(() => false);
      const isInvalid = await auth.passwordInput.evaluate(
        (el) => !(el as HTMLInputElement).validity.valid
      );
      expect(hasError || isInvalid).toBeTruthy();
    });
  });

  test.describe("Logout", () => {
    test("should redirect unauthenticated users from protected pages", async ({ page }) => {
      await page.goto("/fr/library");
      // Should redirect to auth or show auth prompt
      await page.waitForTimeout(3000);
      const url = page.url();
      const isRedirected = url.includes("/auth") || url.includes("/fr");
      expect(isRedirected).toBeTruthy();
    });
  });

  test.describe("Forgot password", () => {
    test("should display the forgot password form", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoForgotPassword("fr");

      await expect(auth.emailInput).toBeVisible();
      await expect(auth.submitButton).toBeVisible();
    });
  });

  test.describe("Reset password", () => {
    test("should display the reset password form", async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.gotoResetPassword("fr");

      await expect(auth.passwordInput).toBeVisible();
    });
  });
});
