import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockExchangeCodeForSession = vi.fn(() => Promise.resolve({ error: null }));
const mockVerifyOtp = vi.fn(() => Promise.resolve({ error: null }));
const mockGetUser = vi.fn(() =>
  Promise.resolve({ data: { user: { id: "user-456" } }, error: null })
);

const mockSupabase = {
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
    verifyOtp: mockVerifyOtp,
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

describe("/api/auth/callback - Comprehensive Coverage", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
    mockVerifyOtp.mockReset();
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } }, error: null });
  });

  describe("Token Hash Flow (Email Templates)", () => {
    it("should handle successful token_hash verification for signup", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?token_hash=abc123&type=signup"
      );

      const response = await GET(request);

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        token_hash: "abc123",
        type: "signup",
      });
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-456");
    });

    it("should handle successful token_hash verification for recovery", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?token_hash=recovery123&type=recovery"
      );

      const response = await GET(request);

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        token_hash: "recovery123",
        type: "recovery",
      });
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-456");
    });

    it("should handle successful token_hash verification for email type", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?token_hash=email123&type=email"
      );

      const response = await GET(request);

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        token_hash: "email123",
        type: "email",
      });
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-456");
    });

    it("should redirect to error page when token_hash verification fails", async () => {
      const mockError = { message: "Invalid or expired token" };
      mockVerifyOtp.mockResolvedValue({ error: mockError });

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?token_hash=invalid&type=signup"
      );

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/auth/error");
      expect(response.headers.get("location")).toContain("Invalid%20or%20expired%20token");
    });

    it("should not call verifyOtp when only token_hash is provided without type", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/callback?token_hash=abc123");

      const response = await GET(request);

      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
    });

    it("should not call verifyOtp when only type is provided without token_hash", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/callback?type=signup");

      const response = await GET(request);

      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
    });
  });

  describe("Code Flow (PKCE)", () => {
    it("should handle successful code exchange", async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null });

      const request = new NextRequest("http://localhost:3000/api/auth/callback?code=pkce_code_123");

      const response = await GET(request);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("pkce_code_123");
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-456");
    });

    it("should redirect to error page when code exchange fails", async () => {
      const mockError = { message: "Code exchange failed" };
      mockExchangeCodeForSession.mockResolvedValue({ error: mockError });

      const request = new NextRequest("http://localhost:3000/api/auth/callback?code=invalid_code");

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/auth/error");
      expect(response.headers.get("location")).toContain("Code%20exchange%20failed");
    });
  });

  describe("Priority: token_hash over code", () => {
    it("should prioritize token_hash flow when both token_hash and code are provided", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });

      const request = new NextRequest(
        "http://localhost:3000/api/auth/callback?token_hash=abc123&type=signup&code=pkce_code"
      );

      const response = await GET(request);

      expect(mockVerifyOtp).toHaveBeenCalled();
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-456");
    });
  });

  describe("No parameters", () => {
    it("should redirect to auth page when no code or token_hash provided", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/callback");

      const response = await GET(request);

      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
    });
  });
});
