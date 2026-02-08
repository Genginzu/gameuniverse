import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions
const mockExchangeCodeForSession = mock(() => Promise.resolve({ error: null }));

const mockSupabase = {
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
  },
};

// Mock the module before importing the route
mock.module("../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../src/app/api/auth/callback/route";

describe("/api/auth/callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
  });

  it("should handle successful auth callback", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/callback?code=auth_code_123");

    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("auth_code_123");
    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
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
