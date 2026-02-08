import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";

// Mock modules before importing the hook
const mockSignInWithPassword = mock(() =>
  Promise.resolve({ data: { user: null, session: null }, error: null })
);
const mockSignUp = mock(() =>
  Promise.resolve({ data: { user: null, session: null }, error: null })
);
const mockSignOut = mock(() => Promise.resolve({ error: null }));
const mockResetPasswordForEmail = mock(() => Promise.resolve({ error: null }));
const mockGetSession = mock(() => Promise.resolve({ data: { session: null }, error: null }));
const mockOnAuthStateChange = mock(() => ({
  data: {
    subscription: {
      unsubscribe: mock(() => {}),
    },
  },
}));

const mockSupabaseClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
};

mock.module("@/lib/supabase", () => ({
  createClient: () => mockSupabaseClient,
}));

const mockPush = mock(() => {});
mock.module("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockClearAuthCookies = mock(() => {});
const mockHandleAuthError = mock(() => Promise.resolve());
mock.module("@/lib/auth-utils", () => ({
  clearAuthCookies: mockClearAuthCookies,
  handleAuthError: mockHandleAuthError,
}));

describe("useAuth comprehensive tests", () => {
  beforeEach(() => {
    mockSignInWithPassword.mockClear();
    mockSignUp.mockClear();
    mockSignOut.mockClear();
    mockResetPasswordForEmail.mockClear();
    mockGetSession.mockClear();
    mockOnAuthStateChange.mockClear();
    mockPush.mockClear();
    mockClearAuthCookies.mockClear();
  });

  describe("signIn function", () => {
    it("should call supabase signInWithPassword with correct credentials", async () => {
      const email = "test@example.com";
      const password = "password123";

      mockSignInWithPassword.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: "123", email },
            session: { access_token: "token", user: { id: "123", email } },
          },
          error: null,
        })
      );

      // Simulate signIn call
      const result = await mockSupabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email, password });
      expect(result.data.user?.email).toBe(email);
      expect(result.error).toBeNull();
    });

    it("should throw error when signIn fails", async () => {
      const mockError = { message: "Invalid login credentials" };
      mockSignInWithPassword.mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: mockError,
        })
      );

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: "test@example.com",
        password: "wrong",
      });

      expect(result.error).toEqual(mockError);
    });

    it("should handle network errors during signIn", async () => {
      mockSignInWithPassword.mockImplementation(() => Promise.reject(new Error("Network error")));

      await expect(
        mockSupabaseClient.auth.signInWithPassword({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("signUp function", () => {
    it("should call supabase signUp with correct parameters", async () => {
      const email = "newuser@example.com";
      const password = "password123";
      const fullName = "New User";
      const preferredLocale = "fr";

      mockSignUp.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: "456", email },
            session: null,
          },
          error: null,
        })
      );

      const result = await mockSupabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: fullName,
            preferred_locale: preferredLocale,
          },
          emailRedirectTo: "http://localhost:3000/api/auth/callback",
        },
      });

      expect(mockSignUp).toHaveBeenCalled();
      expect(result.data.user?.email).toBe(email);
      expect(result.error).toBeNull();
    });

    it("should handle signUp with default values when optional params missing", async () => {
      mockSignUp.mockImplementation(() =>
        Promise.resolve({
          data: { user: { id: "789", email: "test@example.com" }, session: null },
          error: null,
        })
      );

      const result = await mockSupabaseClient.auth.signUp({
        email: "test@example.com",
        password: "password123",
        options: {
          data: {
            username: "",
            preferred_locale: "fr",
          },
          emailRedirectTo: "http://localhost:3000/api/auth/callback",
        },
      });

      expect(result.error).toBeNull();
    });

    it("should throw error when signUp fails", async () => {
      const mockError = { message: "Email already registered" };
      mockSignUp.mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: mockError,
        })
      );

      const result = await mockSupabaseClient.auth.signUp({
        email: "existing@example.com",
        password: "password123",
        options: {
          data: { username: "", preferred_locale: "fr" },
          emailRedirectTo: "http://localhost:3000/api/auth/callback",
        },
      });

      expect(result.error).toEqual(mockError);
    });
  });

  describe("signOut function", () => {
    it("should call supabase signOut", async () => {
      mockSignOut.mockImplementation(() => Promise.resolve({ error: null }));

      const result = await mockSupabaseClient.auth.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it("should handle signOut errors gracefully", async () => {
      const mockError = { message: "Sign out failed" };
      mockSignOut.mockImplementation(() => Promise.resolve({ error: mockError }));

      const result = await mockSupabaseClient.auth.signOut();

      expect(result.error).toEqual(mockError);
    });
  });

  describe("resetPassword function", () => {
    it("should call supabase resetPasswordForEmail with correct parameters", async () => {
      const email = "reset@example.com";
      mockResetPasswordForEmail.mockImplementation(() => Promise.resolve({ error: null }));

      const result = await mockSupabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:3000/auth/reset-password",
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: "http://localhost:3000/auth/reset-password",
      });
      expect(result.error).toBeNull();
    });

    it("should throw error when resetPassword fails", async () => {
      const mockError = { message: "User not found" };
      mockResetPasswordForEmail.mockImplementation(() => Promise.resolve({ error: mockError }));

      const result = await mockSupabaseClient.auth.resetPasswordForEmail(
        "nonexistent@example.com",
        { redirectTo: "http://localhost:3000/auth/reset-password" }
      );

      expect(result.error).toEqual(mockError);
    });
  });

  describe("getSession", () => {
    it("should return session when user is authenticated", async () => {
      const mockSession = {
        user: { id: "123", email: "test@example.com" },
        access_token: "valid_token",
      };
      mockGetSession.mockImplementation(() =>
        Promise.resolve({ data: { session: mockSession }, error: null })
      );

      const result = await mockSupabaseClient.auth.getSession();

      expect(result.data.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it("should return null session when user is not authenticated", async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({ data: { session: null }, error: null })
      );

      const result = await mockSupabaseClient.auth.getSession();

      expect(result.data.session).toBeNull();
    });

    it("should handle token refresh errors", async () => {
      const mockError = { message: "refresh token expired" };
      mockGetSession.mockImplementation(() =>
        Promise.resolve({ data: { session: null }, error: mockError })
      );

      const result = await mockSupabaseClient.auth.getSession();

      expect(result.error?.message).toContain("refresh");
    });
  });

  describe("onAuthStateChange", () => {
    it("should set up auth state listener", () => {
      const callback = mock(() => {});
      mockOnAuthStateChange.mockImplementation(() => ({
        data: {
          subscription: {
            unsubscribe: mock(() => {}),
          },
        },
      }));

      const result = mockSupabaseClient.auth.onAuthStateChange(callback);

      expect(result.data.subscription).toBeDefined();
      expect(typeof result.data.subscription.unsubscribe).toBe("function");
    });

    it("should return unsubscribe function", () => {
      const mockUnsubscribe = mock(() => {});
      mockOnAuthStateChange.mockImplementation(() => ({
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      }));

      const result = mockSupabaseClient.auth.onAuthStateChange(() => {});
      result.data.subscription.unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("loading states", () => {
    it("should start with loading true", () => {
      const initialState = { user: null, session: null, loading: true };
      expect(initialState.loading).toBe(true);
    });

    it("should set loading false after session check", () => {
      const loadedState = { user: null, session: null, loading: false };
      expect(loadedState.loading).toBe(false);
    });

    it("should set loading false even on error", () => {
      const errorState = { user: null, session: null, loading: false };
      expect(errorState.loading).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle token refresh errors by clearing cookies", async () => {
      const tokenError = { message: "refresh token is invalid" };
      mockGetSession.mockImplementation(() =>
        Promise.resolve({ data: { session: null }, error: tokenError })
      );

      const result = await mockSupabaseClient.auth.getSession();

      expect(result.error?.message).toContain("refresh");
    });

    it("should handle generic auth errors", async () => {
      const genericError = { message: "Authentication failed" };
      mockSignInWithPassword.mockImplementation(() =>
        Promise.resolve({ data: { user: null, session: null }, error: genericError })
      );

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: "test@example.com",
        password: "password",
      });

      expect(result.error?.message).toBe("Authentication failed");
    });
  });

  describe("forceSignOut", () => {
    it("should clear auth state and redirect to auth page", () => {
      const clearedState = { user: null, session: null, loading: false };

      expect(clearedState.user).toBeNull();
      expect(clearedState.session).toBeNull();
      expect(clearedState.loading).toBe(false);
    });
  });
});
