import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockExchangeCodeForSession = vi.fn(() => Promise.resolve({ error: null }));
const mockGetUser = vi.fn(() =>
  Promise.resolve({ data: { user: { id: "user-123" } }, error: null })
);

const mockSupabase = {
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
    getUser: mockGetUser,
  },
};

// Mock the module before importing the route
vi.mock("../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../src/app/api/auth/callback/route";

describe("/api/auth/callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
  });

  it("should handle successful auth callback", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/callback?code=auth_code_123");

    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("auth_code_123");
    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-123");
  });

  it("should handle auth callback error", async () => {
    const mockError = { message: "Invalid auth code" };
    mockExchangeCodeForSession.mockResolvedValue({
      error: mockError,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/callback?code=invalid_code");

    const response = await GET(request);

    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toContain("/auth/error");
    expect(response.headers.get("location")).toContain("Invalid%20auth%20code");
  });

  it("should redirect to auth page when no code provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/callback");

    const response = await GET(request);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
  });
});
