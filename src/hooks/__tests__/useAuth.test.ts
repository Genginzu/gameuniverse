import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../useAuth";
import { createClient } from "@/lib/supabase";

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  createClient: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
};

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock subscription
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it("should initialize with loading state", () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it("should sign in successfully", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSession = { user: mockUser, access_token: "token" };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signIn("test@example.com", "password");
      expect(response.user).toEqual(mockUser);
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });
  });

  it("should handle sign in error", async () => {
    const mockError = new Error("Invalid credentials");

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(result.current.signIn("test@example.com", "wrongpassword")).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  it("should sign up successfully with profile data", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSession = { user: mockUser, access_token: "token" };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signUp(
        "test@example.com",
        "password",
        "Test User",
        "fr"
      );
      expect(response.user).toEqual(mockUser);
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
      options: {
        data: {
          username: "Test User",
          preferred_locale: "fr",
        },
      },
    });
  });

  it("should sign out successfully", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it("should reset password successfully", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });

    // Mock window.location.origin
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.resetPassword("test@example.com");
    });

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
      redirectTo: "http://localhost:3000/auth/reset-password",
    });
  });
});
