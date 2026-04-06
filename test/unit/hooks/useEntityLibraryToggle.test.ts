import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockAddToLibrary = vi.fn(async () => true);
const mockRemoveFromLibrary = vi.fn(async () => true);

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

vi.mock("@/hooks/useGameLibraryStatus", () => ({
  useGameLibraryStatus: vi.fn(() => ({
    inLibrary: false,
    loading: false,
    adding: false,
    addToLibrary: mockAddToLibrary,
    removeFromLibrary: mockRemoveFromLibrary,
  })),
}));

vi.mock("@/components/providers/LibraryStatusProvider", () => ({
  useLibraryStatus: () => ({
    getStatus: () => undefined,
    setStatus: vi.fn(),
    loading: false,
  }),
}));

import { useEntityLibraryToggle } from "@/hooks/useEntityLibraryToggle";

describe("useEntityLibraryToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns inLibrary false initially", () => {
    const { result } = renderHook(() => useEntityLibraryToggle("game-1", true));
    expect(result.current.inLibrary).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.adding).toBe(false);
  });

  it("handleToggle calls addToLibrary when not in library", async () => {
    const { result } = renderHook(() => useEntityLibraryToggle("game-1", true));

    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.handleToggle(mockEvent);
    });

    expect(mockAddToLibrary).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
});
