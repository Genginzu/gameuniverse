import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions
const mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
const mockFrom = mock(() => ({}));

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Mock the module
mock.module("../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET, PATCH } from "../../../../src/app/api/profile/route";

const mockUser = {
  id: "123",
  email: "test@example.com",
};

const mockProfile = {
  id: "123",
  email: "test@example.com",
  username: "Test User",
  preferred_locale: "fr",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("/api/profile", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
  });

  describe("GET", () => {
    it("should return user profile successfully", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: mock(() => mockSelect),
        single: mock(() =>
          Promise.resolve({
            data: mockProfile,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: mock(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        user: mockUser,
        profile: mockProfile,
      });
    });

    it("should return 401 when user not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when profile fetch fails", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: mock(() => mockSelect),
        single: mock(() =>
          Promise.resolve({
            data: null,
            error: { message: "Profile not found" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: mock(() => mockSelect),
      });

      const response = await GET();
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

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = {
        eq: mock(() => mockUpdate),
        select: mock(() => mockUpdate),
        single: mock(() =>
          Promise.resolve({
            data: updatedProfile,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        update: mock(() => mockUpdate),
      });

      const request = new NextRequest("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ username: "Updated Name" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.username).toBe("Updated Name");
    });

    it("should return 401 when user not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const request = new NextRequest("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ username: "Updated Name" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should filter out invalid fields", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = {
        eq: mock(() => mockUpdate),
        select: mock(() => mockUpdate),
        single: mock(() =>
          Promise.resolve({
            data: mockProfile,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        update: mock(() => mockUpdate),
      });

      const request = new NextRequest("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          username: "Updated Name",
          invalid_field: "should be filtered",
          email: "should be filtered",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
    });

    it("should return 400 when no valid fields provided", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ invalid_field: "value" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No valid fields to update");
    });
  });
});
