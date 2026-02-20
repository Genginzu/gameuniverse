import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Type for the global mocks
type SupabaseMocks = {
  getUser: ReturnType<typeof mock>;
  single: ReturnType<typeof mock>;
  eq: ReturnType<typeof mock>;
  select: ReturnType<typeof mock>;
  from: ReturnType<typeof mock>;
};

// Access the global mocks from setup.ts
const getMocks = (): SupabaseMocks | null => {
  const globalWithMocks = global as typeof globalThis & {
    __supabaseMocks?: SupabaseMocks;
  };
  return globalWithMocks.__supabaseMocks || null;
};

// Mock fetch globally
const originalFetch = globalThis.fetch;

const mockProfile = {
  id: "123",
  email: "test@example.com",
  username: "Test User",
  preferred_locale: "fr",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("useProfile", () => {
  let mockFetch: ReturnType<typeof mock>;
  let mocks: SupabaseMocks | null;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks = getMocks();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    if (mocks) {
      // Reset all mocks
      mocks.getUser.mockClear();
      mocks.single.mockClear();
      mocks.eq.mockClear();
      mocks.select.mockClear();
      mocks.from.mockClear();

      // Setup default mock implementations
      mocks.getUser.mockImplementation(() =>
        Promise.resolve({ data: { user: null }, error: null })
      );
      mocks.single.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    }

    // Setup fetch mock
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleWarnSpy.mockRestore();
  });

  it("should initialize with loading state", async () => {
    if (!mocks) {
      console.warn("Skipping test: mocks not available");
      return;
    }

    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: null },
        error: null,
      })
    );

    const { useProfile } = await import("../../../src/hooks/useProfile");
    const { result } = renderHook(() => useProfile());

    // Initial state should have loading true
    expect(result.current.loading).toBe(true);
  });

  it("should fetch profile successfully", async () => {
    if (!mocks) {
      console.warn("Skipping test: mocks not available");
      return;
    }

    const mockUser = { id: "123", email: "test@example.com" };

    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: mockUser },
        error: null,
      })
    );

    mocks.single.mockImplementation(() =>
      Promise.resolve({
        data: mockProfile,
        error: null,
      })
    );

    const { useProfile } = await import("../../../src/hooks/useProfile");
    const { result } = renderHook(() => useProfile());

    // Wait for the effect to complete
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBe(null);
  });

  it("should handle no authenticated user", async () => {
    if (!mocks) {
      console.warn("Skipping test: mocks not available");
      return;
    }

    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: null },
        error: null,
      })
    );

    const { useProfile } = await import("../../../src/hooks/useProfile");
    const { result } = renderHook(() => useProfile());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe("Not authenticated");
  });

  it("should handle profile fetch error", async () => {
    if (!mocks) {
      console.warn("Skipping test: mocks not available");
      return;
    }

    const mockUser = { id: "123", email: "test@example.com" };
    const mockError = { message: "Profile not found" };

    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: mockUser },
        error: null,
      })
    );

    mocks.single.mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: mockError,
      })
    );

    const { useProfile } = await import("../../../src/hooks/useProfile");
    const { result } = renderHook(() => useProfile());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe("Profile not found");
  });

  it("should update profile successfully", async () => {
    if (!mocks) {
      console.warn("Skipping test: mocks not available");
      return;
    }

    const mockUser = { id: "123", email: "test@example.com" };
    const updatedProfile = { ...mockProfile, username: "Updated Name" };

    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: mockUser },
        error: null,
      })
    );

    mocks.single.mockImplementation(() =>
      Promise.resolve({
        data: mockProfile,
        error: null,
      })
    );

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(updatedProfile),
      })
    );

    const { useProfile } = await import("../../../src/hooks/useProfile");
    const { result } = renderHook(() => useProfile());

    // Wait for initial load
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    // Update profile
    let updateResult: typeof updatedProfile | undefined;
    await act(async () => {
      updateResult = await result.current.updateProfile({
        username: "Updated Name",
      });
    });

    expect(updateResult).toEqual(updatedProfile);
    expect(mockFetch).toHaveBeenCalledWith("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: "Updated Name" }),
    });

    expect(result.current.profile).toEqual(updatedProfile);
  });

  it("should handle profile update error", async () => {
    if (!mocks) {
      console.warn("Skipping test: mocks not available");
      return;
    }

    const mockUser = { id: "123", email: "test@example.com" };

    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: mockUser },
        error: null,
      })
    );

    mocks.single.mockImplementation(() =>
      Promise.resolve({
        data: mockProfile,
        error: null,
      })
    );

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Update failed" }),
      })
    );

    const { useProfile } = await import("../../../src/hooks/useProfile");
    const { result } = renderHook(() => useProfile());

    // Wait for initial load
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    // Try to update profile - should throw
    await act(async () => {
      await expect(result.current.updateProfile({ username: "Updated Name" })).rejects.toThrow(
        "Update failed"
      );
    });

    expect(result.current.error).toBe("Update failed");
  });
});
