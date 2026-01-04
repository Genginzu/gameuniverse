import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Navigation } from "../Navigation";
import { NextIntlClientProvider } from "next-intl";

// Mock the useAuth hook with Bun's mock system
const mockSignOut = jest.fn();

// Create a mock implementation
const mockUseAuthImplementation = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: mockSignOut,
  resetPassword: jest.fn(),
};

// Mock the module
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthImplementation,
}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock messages for testing
const messages = {
  navigation: {
    home: "Home",
    library: "Library",
    dashboard: "Dashboard",
    login: "Login",
    signup: "Sign up",
    logout: "Logout",
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe("Navigation Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    Object.assign(mockUseAuthImplementation, {
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: mockSignOut,
      resetPassword: jest.fn(),
    });
  });

  describe("Unauthenticated User Navigation", () => {
    test("displays login and signup buttons for unauthenticated users", () => {
      renderWithIntl(<Navigation />);

      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Sign up")).toBeInTheDocument();
      expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    });

    test("shows basic navigation links for unauthenticated users", () => {
      renderWithIntl(<Navigation />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Library")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    test("displays Game Universe brand link", () => {
      renderWithIntl(<Navigation />);

      expect(screen.getByText("Game Universe")).toBeInTheDocument();
    });
  });

  describe("Authenticated User Navigation", () => {
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      user_metadata: {
        full_name: "Test User",
      },
      created_at: "2024-01-01T00:00:00Z",
      last_sign_in_at: "2024-01-01T00:00:00Z",
    };

    beforeEach(() => {
      Object.assign(mockUseAuthImplementation, {
        user: mockUser,
        session: {},
        loading: false,
      });
    });

    test("displays user info and logout button for authenticated users", () => {
      renderWithIntl(<Navigation />);

      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
      expect(screen.queryByText("Login")).not.toBeInTheDocument();
      expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
    });

    test("shows dashboard link for authenticated users", () => {
      renderWithIntl(<Navigation />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Library")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    test("calls signOut when logout button is clicked", async () => {
      renderWithIntl(<Navigation />);

      const logoutButton = screen.getByText("Logout");
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    test("displays email when full name is not available", () => {
      const userWithoutName = {
        ...mockUser,
        user_metadata: {},
      };

      Object.assign(mockUseAuthImplementation, {
        user: userWithoutName,
      });

      renderWithIntl(<Navigation />);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    beforeEach(() => {
      Object.assign(mockUseAuthImplementation, {
        user: null,
        session: null,
        loading: true,
      });
    });

    test("displays loading state when authentication is loading", () => {
      renderWithIntl(<Navigation />);

      // Should show loading placeholder instead of auth buttons
      const loadingElement = document.querySelector(".animate-pulse");
      expect(loadingElement).toBeInTheDocument();
      expect(screen.queryByText("Login")).not.toBeInTheDocument();
      expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    test("contains correct href attributes for navigation links", () => {
      renderWithIntl(<Navigation />);

      const homeLink = screen.getByText("Home").closest("a");
      const libraryLink = screen.getByText("Library").closest("a");
      const loginLink = screen.getByText("Login").closest("a");
      const signupLink = screen.getByText("Sign up").closest("a");

      expect(homeLink).toHaveAttribute("href", "/");
      expect(libraryLink).toHaveAttribute("href", "/library");
      expect(loginLink).toHaveAttribute("href", "/auth?mode=signin");
      expect(signupLink).toHaveAttribute("href", "/auth?mode=signup");
    });
  });
});
