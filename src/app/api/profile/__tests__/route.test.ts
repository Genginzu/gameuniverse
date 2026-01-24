import { GET, PATCH } from "../route";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

// Mock Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

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
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("GET", () => {
    it("should return user profile successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
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
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when profile fetch fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Profile not found" },
          }),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
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

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null,
            }),
          })),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
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
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "Updated Name",
          updated_at: expect.any(String),
        })
      );
    });

    it("should return 401 when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
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
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
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
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "Updated Name",
          updated_at: expect.any(String),
        })
      );
      expect(mockUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          invalid_field: expect.any(String),
          email: expect.any(String),
        })
      );
    });

    it("should return 400 when no valid fields provided", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
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
