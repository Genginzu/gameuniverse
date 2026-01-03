import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "../AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations, useLocale } from "next-intl";

// Mock hooks
jest.mock("@/hooks/useAuth");
jest.mock("next-intl");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTranslations = useTranslations as jest.MockedFunction<typeof useTranslations>;
const mockUseLocale = useLocale as jest.MockedFunction<typeof useLocale>;

const mockTranslations = {
  "signin.title": "Sign In",
  "signin.description": "Sign in to your account",
  "signin.submit": "Sign In",
  "signin.switchText": "Don't have an account?",
  "signin.switchLink": "Create account",
  "signup.title": "Sign Up",
  "signup.description": "Create your account",
  "signup.submit": "Create Account",
  "signup.switchText": "Already have an account?",
  "signup.switchLink": "Sign in",
  "form.email": "Email",
  "form.emailPlaceholder": "your@email.com",
  "form.password": "Password",
  "form.passwordPlaceholder": "Your password",
  "form.fullName": "Full Name",
  "form.fullNamePlaceholder": "Your full name",
  "form.submitting": "Processing...",
  "error.generic": "An error occurred",
};

describe("AuthForm", () => {
  const mockSignIn = jest.fn();
  const mockSignUp = jest.fn();
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    });

    mockUseTranslations.mockReturnValue(
      (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key
    );
    mockUseLocale.mockReturnValue("fr");
  });

  it("should render sign in form", () => {
    render(<AuthForm mode="signin" onModeChange={mockOnModeChange} />);

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Full Name")).not.toBeInTheDocument();
  });

  it("should render sign up form", () => {
    render(<AuthForm mode="signup" onModeChange={mockOnModeChange} />);

    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("should handle sign in submission", async () => {
    mockSignIn.mockResolvedValue({ user: { id: "123" } });

    render(<AuthForm mode="signin" onModeChange={mockOnModeChange} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("should handle sign up submission", async () => {
    mockSignUp.mockResolvedValue({ user: { id: "123" } });

    render(<AuthForm mode="signup" onModeChange={mockOnModeChange} />);

    const fullNameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(fullNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123", "Test User", "fr");
    });
  });

  it("should display error message on authentication failure", async () => {
    const errorMessage = "Invalid credentials";
    mockSignIn.mockRejectedValue(new Error(errorMessage));

    render(<AuthForm mode="signin" onModeChange={mockOnModeChange} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("should disable submit button when form is invalid", () => {
    render(<AuthForm mode="signin" onModeChange={mockOnModeChange} />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    expect(submitButton).toBeDisabled();

    // Fill only email
    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(submitButton).toBeDisabled();

    // Fill password too
    const passwordInput = screen.getByLabelText("Password");
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("should switch between signin and signup modes", () => {
    render(<AuthForm mode="signin" onModeChange={mockOnModeChange} />);

    const switchButton = screen.getByText("Create account");
    fireEvent.click(switchButton);

    expect(mockOnModeChange).toHaveBeenCalledWith("signup");
  });

  it("should clear error when user starts typing", async () => {
    const errorMessage = "Invalid credentials";
    mockSignIn.mockRejectedValue(new Error(errorMessage));

    render(<AuthForm mode="signin" onModeChange={mockOnModeChange} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Trigger error
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: "test2@example.com" } });

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });
});
