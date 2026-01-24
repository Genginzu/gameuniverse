import { renderHook, act } from "@testing-library/react";
import { useProfile } from "../useProfile";
import { createClient } from "@/lib/supabase";

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  createClient: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

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
  })),
};

const mockProfile = {
  id: "123",
  email: "test@example.com",
  username: "Test User",
  preferred_locale: "fr",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("useProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (fetch as jest.Mock).mockClear();
  });

  it("should initialize with loading state", () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useProfile());

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("should fetch profile successfully", async () => {
    const mockUser = { id: "123", email: "test@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
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

    const { result } = renderHook(() => useProfile());

    // Wait for the effect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBe(null);
  });

  it("should handle profile fetch error", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const mockError = { message: "Profile not found" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      })),
    }));

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useProfile());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe("Profile not found");
  });

  it("should update profile successfully", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    const updatedProfile = { ...mockProfile, username: "Updated Name" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    // Mock initial profile fetch
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

    // Mock fetch for profile update
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(updatedProfile),
    });

    const { result } = renderHook(() => useProfile());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Update profile
    await act(async () => {
      const response = await result.current.updateProfile({
        username: "Updated Name",
      });
      expect(response).toEqual(updatedProfile);
    });

    expect(fetch).toHaveBeenCalledWith("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: "Updated Name" }),
    });

    expect(result.current.profile).toEqual(updatedProfile);
  });

  it("should handle profile update error", async () => {
    const mockUser = { id: "123", email: "test@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    // Mock initial profile fetch
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

    // Mock fetch error for profile update
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Update failed" }),
    });

    const { result } = renderHook(() => useProfile());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Try to update profile
    await act(async () => {
      await expect(result.current.updateProfile({ username: "Updated Name" })).rejects.toThrow(
        "Update failed"
      );
    });

    expect(result.current.error).toBe("Update failed");
  });
});
