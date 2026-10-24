import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const mockFrom = vi.fn(() => ({}));

const mockSupabase = {
  from: mockFrom,
};

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { GET, PATCH } from "@/app/api/profile/route";

const routeEnv = useTestRouteEnvironment({ signedInAs: "user" });

const mockUser = testUser("user", { id: "123", email: "test@example.com" });

const mockProfile = {
  id: "123",
  email: "test@example.com",
  username: "Test User",
  preferred_locale: "fr",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function patchRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function getRequest() {
  return new NextRequest("http://localhost:3000/api/profile");
}

describe("/api/profile", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    routeEnv.signIn(mockUser);
  });

  describe("GET", () => {
    it("should return user profile successfully", async () => {
      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockProfile,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET(getRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        user: mockUser,
        profile: mockProfile,
      });
    });

    it("should return 401 when user not authenticated", async () => {
      routeEnv.signOut();

      const response = await GET(getRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Authentication required", code: "unauthorized" });
    });

    it("should return 500 when profile fetch fails", async () => {
      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: "Profile not found" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET(getRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch profile");
    });
  });

  describe("PATCH", () => {
    it("should update profile successfully", async () => {
      const updatedProfile = {
        ...mockProfile,
        username: "Updated Name",
        updated_at: expect.any(String),
      };

      const mockUpdate = {
        eq: vi.fn(() => mockUpdate),
        select: vi.fn(() => mockUpdate),
        single: vi.fn(() =>
          Promise.resolve({
            data: updatedProfile,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        update: vi.fn(() => mockUpdate),
      });

      const response = await PATCH(patchRequest({ username: "Updated Name" }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.username).toBe("Updated Name");
    });

    it("should return 401 when user not authenticated", async () => {
      routeEnv.signOut();

      const response = await PATCH(patchRequest({ username: "Updated Name" }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Authentication required", code: "unauthorized" });
    });

    it("should return 403 when the account is suspended", async () => {
      routeEnv.suspend("2030-01-01T00:00:00Z");

      const response = await PATCH(patchRequest({ username: "Updated Name" }));

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ code: "suspended" });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should return 429 when the profileUpdate rate limit is exceeded", async () => {
      routeEnv.exceedRateLimit(30);

      const response = await PATCH(patchRequest({ username: "Updated Name" }));

      expect(response.status).toBe(429);
      expect(await response.json()).toMatchObject({ code: "rate_limited", retryAfter: 30 });
      expect(routeEnv.rateLimitHits).toEqual(["profileUpdate:user:123"]);
    });

    it("should filter out invalid fields", async () => {
      const mockUpdate = {
        eq: vi.fn(() => mockUpdate),
        select: vi.fn(() => mockUpdate),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockProfile,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        update: vi.fn(() => mockUpdate),
      });

      const response = await PATCH(
        patchRequest({
          username: "Updated Name",
          invalid_field: "should be filtered",
          email: "should be filtered",
        })
      );

      expect(response.status).toBe(200);
    });

    it("should return 400 when no valid fields provided", async () => {
      const response = await PATCH(patchRequest({ invalid_field: "value" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "No valid fields to update", code: "validation" });
    });

    it("should toggle stats_private and ignore privileged fields", async () => {
      const updateChain = {
        eq: vi.fn(() => updateChain),
        select: vi.fn(() => updateChain),
        single: vi.fn(() =>
          Promise.resolve({ data: { ...mockProfile, stats_private: true }, error: null })
        ),
      };
      const update = vi.fn(() => updateChain);
      mockFrom.mockReturnValue({ update });

      const response = await PATCH(
        patchRequest({ stats_private: true, level: 99, avatar_url: "https://evil.test/x.png" })
      );

      expect(response.status).toBe(200);
      const payload = (update.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
      expect(payload.stats_private).toBe(true);
      expect(payload).not.toHaveProperty("level");
      expect(payload).not.toHaveProperty("avatar_url");
    });

    it("should reject a non-boolean stats_private", async () => {
      const response = await PATCH(patchRequest({ stats_private: "yes" }));

      expect(response.status).toBe(400);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
