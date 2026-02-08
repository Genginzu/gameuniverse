import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";

// Mock React hooks before importing
const mockSetState = mock(() => {});
let currentState = { user: null, session: null, loading: true };

mock.module("react", () => ({
  useState: (initial: unknown) => {
    if (typeof initial === "object" && initial !== null && "loading" in (initial as object)) {
      currentState = initial as typeof currentState;
    }
    return [
      currentState,
      (newState: typeof currentState) => {
        currentState = typeof newState === "function" ? newState(currentState) : newState;
        mockSetState(currentState);
      },
    ];
  },
  useEffect: (callback: () => void | (() => void)) => {
    const cleanup = callback();
    if (cleanup) cleanup();
  },
}));

// Mock router
const mockPush = mock(() => {});
mock.module("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Supabase
const mockSignInWithPassword = mock(() =>
  Promise.resolve({ data: { user: { id: "1" }, session: { access_token: "token" } }, error: null })
);
const mockSignUp = mock(() =>
  Promise.resolve({ data: { user: { id: "1" }, session: null }, error: null })
);
const mockSignOut = mock(() => Promise.resolve({ error: null }));
const mockResetPasswordForEmail = mock(() => Promise.resolve({ error: null }));
const mockGetSession = mock(() => Promise.resolve({ data: { session: null }, error: null }));
const mockUnsubscribe = mock(() => {});
const mockOnAuthStateChange = mock((callback: (event: string, session: unknown) => void) => {
  return {
    data: {
      subscription: { unsubscribe: mockUnsubscribe },
    },
  };
});

mock.module("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

// Mock auth-utils
const mockClearAuthCookies = mock(() => {});
mock.module("@/lib/auth-utils", () => ({
  clearAuthCookies: mockClearAuthCookies,
}));

// Now import the actual hook
import { useAuth, type AuthState } from "../../../src/hooks/useAuth";

describe("useAuth integration tests", () => {
  beforeEach(() => {
    currentState = { user: null, session: null, loading: true };
    mockSetState.mockClear();
    mockPush.mockClear();
    mockSignInWithPassword.mockClear();
    mockSignUp.mockClear();
    mockSignOut.mockClear();
    mockResetPasswordForEmail.mockClear();
    mockGetSession.mockClear();
    mockOnAuthStateChange.mockClear();
    mockClearAuthCookies.mockClear();
    mockUnsubscribe.mockClear();
  });

  describe("hook initialization", () => {
    it("should return auth state and functions", () => {
      const result = useAuth();

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("session");
      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("signIn");
      expect(result).toHaveProperty("signUp");
      expect(result).toHaveProperty("signOut");
      expect(result).toHaveProperty("forceSignOut");
      expect(result).toHaveProperty("resetPassword");
    });

    it("should have correct initial state", () => {
      const result = useAuth();

      expect(result.loading).toBe(true);
    });
  });

  describe("signIn", () => {
    it("should call supabase signInWithPassword", async () => {
      const { signIn } = useAuth();

      await signIn("test@example.com", "password123");

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should return data on successful sign in", async () => {
      mockSignInWithPassword.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: "123", email: "test@example.com" },
            session: { access_token: "token" },
          },
          error: null,
        })
      );

      const { signIn } = useAuth();
      const result = await signIn("test@example.com", "password123");

      expect(result.user?.id).toBe("123");
    });

    it("should throw error on failed sign in", async () => {
      mockSignInWithPassword.mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Invalid credentials" },
        })
      );

      const { signIn } = useAuth();

      await expect(signIn("test@example.com", "wrong")).rejects.toEqual({
        message: "Invalid credentials",
      });
    });
  });

  describe("signUp", () => {
    it("should call supabase signUp with correct options", async () => {
      const { signUp } = useAuth();

      await signUp("new@example.com", "password123", "John Doe", "en");

      expect(mockSignUp).toHaveBeenCalled();
      const callArgs = mockSignUp.mock.calls[0][0] as {
        email: string;
        password: string;
        options: { data: { username: string; preferred_locale: string } };
      };
      expect(callArgs.email).toBe("new@example.com");
      expect(callArgs.password).toBe("password123");
      expect(callArgs.options.data.username).toBe("John Doe");
      expect(callArgs.options.data.preferred_locale).toBe("en");
    });

    it("should use default values when optional params missing", async () => {
      const { signUp } = useAuth();

      await signUp("new@example.com", "password123");

      const callArgs = mockSignUp.mock.calls[0][0] as {
        options: { data: { username: string; preferred_locale: string } };
      };
      expect(callArgs.options.data.username).toBe("");
      expect(callArgs.options.data.preferred_locale).toBe("fr");
    });

    it("should throw error on failed sign up", async () => {
      mockSignUp.mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Email already exists" },
        })
      );

      const { signUp } = useAuth();

      await expect(signUp("existing@example.com", "password123")).rejects.toEqual({
        message: "Email already exists",
      });
    });
  });

  describe("signOut", () => {
    it("should call supabase signOut", async () => {
      const { signOut } = useAuth();

      await signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("should clear auth cookies", async () => {
      const { signOut } = useAuth();

      await signOut();

      expect(mockClearAuthCookies).toHaveBeenCalled();
    });

    it("should redirect to home page", async () => {
      const { signOut } = useAuth();

      await signOut();

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should handle signOut errors gracefully", async () => {
      mockSignOut.mockImplementation(() =>
        Promise.resolve({ error: { message: "Sign out failed" } })
      );

      const { signOut } = useAuth();

      // Should not throw
      await signOut();

      expect(mockClearAuthCookies).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should handle signOut exceptions gracefully", async () => {
      mockSignOut.mockImplementation(() => Promise.reject(new Error("Network error")));

      const { signOut } = useAuth();

      // Should not throw
      await signOut();

      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("forceSignOut", () => {
    it("should clear auth cookies", async () => {
      const { forceSignOut } = useAuth();

      await forceSignOut();

      expect(mockClearAuthCookies).toHaveBeenCalled();
    });

    it("should redirect to auth page", async () => {
      const { forceSignOut } = useAuth();

      await forceSignOut();

      expect(mockPush).toHaveBeenCalledWith("/auth");
    });
  });

  describe("resetPassword", () => {
    it("should call supabase resetPasswordForEmail", async () => {
      // Mock window.location
      const originalLocation = globalThis.window?.location;
      Object.defineProperty(globalThis, "window", {
        value: { location: { origin: "http://localhost:3000" } },
        writable: true,
      });

      const { resetPassword } = useAuth();

      await resetPassword("test@example.com");

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:3000/auth/reset-password",
      });

      // Restore
      if (originalLocation) {
        Object.defineProperty(globalThis, "window", {
          value: { location: originalLocation },
          writable: true,
        });
      }
    });

    it("should throw error on failed reset", async () => {
      Object.defineProperty(globalThis, "window", {
        value: { location: { origin: "http://localhost:3000" } },
        writable: true,
      });

      mockResetPasswordForEmail.mockImplementation(() =>
        Promise.resolve({ error: { message: "User not found" } })
      );

      const { resetPassword } = useAuth();

      await expect(resetPassword("unknown@example.com")).rejects.toEqual({
        message: "User not found",
      });
    });
  });
});
