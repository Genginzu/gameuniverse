import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";
import { AuthForm } from "../auth/AuthForm";
import type { AuthMode } from "@/types/auth";

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }));

vi.mock("next-intl", () => {
  const t = Object.assign((key: string) => key, { rich: (key: string) => key });
  return { useTranslations: () => t, useLocale: () => "fr" };
});
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signIn: mocks.signIn, signUp: mocks.signUp, loading: false }),
}));
vi.mock("@/components/auth/AuthCard", () => ({
  AuthCard: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
  AUTH_INPUT_CLASS: "",
  AUTH_LABEL_CLASS: "",
  AUTH_LINK_CLASS: "",
  AUTH_PRIMARY_BTN_CLASS: "",
}));

/** Real parent behaviour: the page owns the mode and passes it back down. */
function Harness({
  initialMode,
  onModeChange,
}: {
  initialMode: AuthMode;
  onModeChange: (m: AuthMode) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  return (
    <AuthForm
      mode={mode}
      onModeChange={(next) => {
        onModeChange(next);
        setMode(next);
      }}
    />
  );
}

function renderForm(mode: AuthMode = "signin") {
  const onModeChange = vi.fn();
  render(<Harness initialMode={mode} onModeChange={onModeChange} />);
  return { onModeChange };
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submitButton = (name: string) => screen.getByRole("button", { name });

describe("AuthForm", () => {
  beforeEach(() => {
    mocks.signIn.mockReset().mockResolvedValue(undefined);
    mocks.signUp.mockReset().mockResolvedValue({ user: { identities: [{}] } });
  });

  describe("sign in", () => {
    it("enables submit once email and password are filled, then calls signIn", async () => {
      renderForm("signin");
      expect(screen.queryByLabelText("form.fullName")).not.toBeInTheDocument();
      expect(submitButton("signin.submit")).toBeDisabled();

      type("form.email", "player@example.com");
      type("form.password", "secret123");
      expect(submitButton("signin.submit")).toBeEnabled();

      fireEvent.click(submitButton("signin.submit"));
      await waitFor(() =>
        expect(mocks.signIn).toHaveBeenCalledWith("player@example.com", "secret123")
      );
    });

    it("translates known Supabase errors and clears them when typing", async () => {
      mocks.signIn.mockRejectedValue(new Error("Invalid login credentials"));
      renderForm("signin");
      type("form.email", "player@example.com");
      type("form.password", "wrong-pass");
      fireEvent.click(submitButton("signin.submit"));

      expect(await screen.findByText("error.invalidCredentials")).toBeInTheDocument();
      type("form.password", "wrong-pass2");
      expect(screen.queryByText("error.invalidCredentials")).not.toBeInTheDocument();
    });

    it("shows unknown error messages as-is", async () => {
      mocks.signIn.mockRejectedValue(new Error("Service unavailable"));
      renderForm("signin");
      type("form.email", "player@example.com");
      type("form.password", "secret123");
      fireEvent.click(submitButton("signin.submit"));
      expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
    });

    it("switches to sign up", () => {
      const { onModeChange } = renderForm("signin");
      fireEvent.click(screen.getByRole("button", { name: "signin.switchLink" }));
      expect(onModeChange).toHaveBeenCalledWith("signup");
      expect(screen.getByLabelText("form.fullName")).toBeInTheDocument();
    });
  });

  describe("sign up", () => {
    function fillSignUp() {
      type("form.fullName", "Player One");
      type("form.email", "player@example.com");
      type("form.password", "secret123");
    }

    it("requires the consent checkbox before submitting", () => {
      renderForm("signup");
      fillSignUp();
      expect(submitButton("signup.submit")).toBeDisabled();

      fireEvent.click(screen.getByRole("checkbox"));
      expect(submitButton("signup.submit")).toBeEnabled();
    });

    it("calls signUp with the locale and shows the email-sent screen", async () => {
      renderForm("signup");
      fillSignUp();
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(submitButton("signup.submit"));

      expect(await screen.findByText("signup.emailSentTitle")).toBeInTheDocument();
      expect(mocks.signUp).toHaveBeenCalledWith(
        "player@example.com",
        "secret123",
        "Player One",
        "fr"
      );
      expect(screen.getByText("player@example.com")).toBeInTheDocument();
    });

    it("goes back to sign in from the email-sent screen", async () => {
      const { onModeChange } = renderForm("signup");
      fillSignUp();
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(submitButton("signup.submit"));

      fireEvent.click(await screen.findByRole("button", { name: "signin.title" }));
      expect(onModeChange).toHaveBeenCalledWith("signin");
      expect(submitButton("signin.submit")).toBeInTheDocument();
    });

    it("redirects existing accounts (no identities) to sign in with a notice", async () => {
      mocks.signUp.mockResolvedValue({ user: { identities: [] } });
      const { onModeChange } = renderForm("signup");
      fillSignUp();
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(submitButton("signup.submit"));

      expect(await screen.findByText("signup.userAlreadyExists")).toBeInTheDocument();
      expect(onModeChange).toHaveBeenCalledWith("signin");
      expect(screen.queryByText("signup.emailSentTitle")).not.toBeInTheDocument();
    });
  });
});
