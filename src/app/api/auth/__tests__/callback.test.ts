import { GET } from "../callback/route";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

// Mock Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    exchangeCodeForSession: jest.fn(),
  },
};

describe("/api/auth/callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it("should handle successful auth callback", async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/callback?code=auth_code_123");

    const response = await GET(request);

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("auth_code_123");
    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("should handle auth callback error", async () => {
    const mockError = { message: "Invalid auth code" };
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
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

    expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
  });
});
