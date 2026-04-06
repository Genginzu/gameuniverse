import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockToggleFavorite = vi.fn();

vi.mock("@/hooks/useCharacterFavorite", () => ({
  useCharacterFavorite: vi.fn(() => ({
    isFavorite: false,
    isLoading: false,
    isToggling: false,
    toggleFavorite: mockToggleFavorite,
  })),
}));

vi.mock("@/components/providers/CharacterFavoriteStatusProvider", () => ({
  useCharacterFavoriteStatus: () => ({
    getStatus: () => undefined,
    setStatus: vi.fn(),
    loading: false,
  }),
}));

import { useEntityCharacterFavorite } from "@/hooks/useEntityCharacterFavorite";

describe("useEntityCharacterFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isFavorite false initially", () => {
    const { result } = renderHook(() => useEntityCharacterFavorite("char-slug", true));
    expect(result.current.isFavorite).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.toggling).toBe(false);
  });

  it("handleToggle calls individual toggleFavorite when no batch", async () => {
    const { result } = renderHook(() => useEntityCharacterFavorite("char-slug", true));

    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.handleToggle(mockEvent);
    });

    expect(mockToggleFavorite).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
});
