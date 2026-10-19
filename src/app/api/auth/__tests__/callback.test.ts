import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockExchangeCodeForSession = vi.fn(() => Promise.resolve({ error: null }));
const mockVerifyOtp = vi.fn(() => Promise.resolve({ error: null as { message: string } | null }));
const mockGetUser = vi.fn(() =>
  Promise.resolve({ data: { user: { id: "user-123" } }, error: null })
);

const mockSupabase = {
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
    verifyOtp: mockVerifyOtp,
    getUser: mockGetUser,
  },
};

// Mock the module before importing the route
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Import after mocking
import { GET, POST } from "@/app/api/auth/callback/route";

function confirmPost(fields: Record<string, string>, headers: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/auth/callback", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(fields).toString(),
  });
}

describe("/api/auth/callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
    mockVerifyOtp.mockReset();
    mockVerifyOtp.mockResolvedValue({ error: null });
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

  it("redirects to the error page with a fixed reason, never the raw message", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid auth code" },
    } as never);

    const request = new NextRequest("http://localhost:3000/api/auth/callback?code=invalid_code");

    const response = await GET(request);

    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error?reason=invalid_link"
    );
  });

  it("should redirect to auth page when no code provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/callback");

    const response = await GET(request);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
  });

  it("does not verify an email link on GET: sends it to the confirmation page", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/callback?token_hash=hash_123&type=magiclink"
    );

    const response = await GET(request);

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/confirm?token=hash_123&type=magiclink"
    );
  });

  it("verifies the email link on a same-origin POST", async () => {
    const response = await POST(
      confirmPost({ token_hash: "hash_123", type: "signup" }, { "sec-fetch-site": "same-origin" })
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: "hash_123", type: "signup" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/players/user-123");
  });

  it("accepts a matching Origin when Sec-Fetch-Site is absent", async () => {
    const response = await POST(
      confirmPost({ token_hash: "hash_123", type: "email" }, { origin: "http://localhost:3000" })
    );

    expect(mockVerifyOtp).toHaveBeenCalled();
    expect(response.status).toBe(303);
  });

  it.each([
    [{ "sec-fetch-site": "cross-site" }],
    [{ origin: "https://attacker.example" }],
    [{}],
  ])("refuses a cross-site POST (login CSRF) %j", async (headers) => {
    const response = await POST(confirmPost({ token_hash: "hash_123", type: "signup" }, headers));

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error?reason=forbidden"
    );
  });

  it("follows a safe relative next path and ignores an external one", async () => {
    const safe = await POST(
      confirmPost(
        { token_hash: "h", type: "signup", next: "/library" },
        { "sec-fetch-site": "same-origin" }
      )
    );
    expect(safe.headers.get("location")).toBe("http://localhost:3000/library");

    const external = await POST(
      confirmPost(
        { token_hash: "h", type: "signup", next: "//evil.example" },
        { "sec-fetch-site": "same-origin" }
      )
    );
    expect(external.headers.get("location")).toBe("http://localhost:3000/players/user-123");
  });

  it("rejects an unknown OTP type without verifying", async () => {
    const response = await POST(
      confirmPost({ token_hash: "h", type: "phone_change" }, { "sec-fetch-site": "same-origin" })
    );

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth?mode=signin");
  });

  it("redirects to the error page when the link is expired", async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: "Token has expired" } });

    const response = await POST(
      confirmPost({ token_hash: "h", type: "signup" }, { "sec-fetch-site": "same-origin" })
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error?reason=invalid_link"
    );
  });
});
