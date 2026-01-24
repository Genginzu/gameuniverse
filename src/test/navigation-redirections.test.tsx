import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import Home from "@/app/page";
import DashboardPage from "@/app/dashboard/page";

// Mock the useAuth hook with Bun's mock system
const mockUseAuthImplementation = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
};

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthImplementation,
}));

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock components to avoid complex rendering
jest.mock("@/components/Navigation", () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

jest.mock("@/components/LandingPage", () => ({
  LandingPage: () => <div data-testid="landing-page">Landing Page</div>,
}));

jest.mock("@/components/Dashboard", () => ({
  Dashboard: ({ user }: { user: any }) => (
    <div data-testid="dashboard">Dashboard for {user.email}</div>
  ),
}));

// Mock messages for testing
const messages = {
  dashboard: {
    title: "Dashboard",
    welcome: "Welcome, {name}",
    quickActions: "Quick actions",
    browseLibrary: "Browse library",
    searchGames: "Search games",
    profile: "Profile",
    settings: "Settings",
  },
  common: {
    loading: "Loading...",
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe("Navigation and Redirections", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    Object.assign(mockUseAuthImplementation, {
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    });
  });

  describe("Home Page Redirections", () => {
    test("redirects authenticated users to dashboard", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        user_metadata: { username: "Test User" },
      };

      Object.assign(mockUseAuthImplementation, {
        user: mockUser,
        session: {},
        loading: false,
      });

      renderWithIntl(<Home />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    test("shows landing page for unauthenticated users", async () => {
      renderWithIntl(<Home />);

      await waitFor(() => {
        expect(screen.getByTestId("landing-page")).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    test("shows loading state while checking authentication", () => {
      Object.assign(mockUseAuthImplementation, {
        loading: true,
      });

      renderWithIntl(<Home />);

      expect(screen.getByText("Chargement...")).toBeInTheDocument();
      expect(screen.queryByTestId("landing-page")).not.toBeInTheDocument();
    });

    test("does not render landing page for authenticated users", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
      };

      Object.assign(mockUseAuthImplementation, {
        user: mockUser,
        session: {},
        loading: false,
      });

      renderWithIntl(<Home />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });

      // Should not render landing page content
      expect(screen.queryByTestId("landing-page")).not.toBeInTheDocument();
    });
  });

  describe("Dashboard Page Redirections", () => {
    test("redirects unauthenticated users to auth page", async () => {
      renderWithIntl(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/auth?mode=signin");
      });
    });

    test("shows dashboard for authenticated users", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        user_metadata: { username: "Test User" },
      };

      Object.assign(mockUseAuthImplementation, {
        user: mockUser,
        session: {},
        loading: false,
      });

      renderWithIntl(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard")).toBeInTheDocument();
        expect(screen.getByText("Dashboard for test@example.com")).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    test("shows loading state while checking authentication", () => {
      Object.assign(mockUseAuthImplementation, {
        loading: true,
      });

      renderWithIntl(<DashboardPage />);

      expect(screen.getByText("Chargement...")).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
    });

    test("does not render dashboard for unauthenticated users", async () => {
      renderWithIntl(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/auth?mode=signin");
      });

      // Should not render dashboard content
      expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
    });
  });

  describe("Authentication State Changes", () => {
    test("handles authentication state transitions correctly", async () => {
      // Start with loading state
      Object.assign(mockUseAuthImplementation, {
        loading: true,
      });

      const { rerender } = renderWithIntl(<Home />);

      expect(screen.getByText("Chargement...")).toBeInTheDocument();

      // Transition to unauthenticated state
      Object.assign(mockUseAuthImplementation, {
        loading: false,
      });

      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Home />
        </NextIntlClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("landing-page")).toBeInTheDocument();
        expect(screen.queryByText("Chargement...")).not.toBeInTheDocument();
      });
    });
  });
});
