import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGameAccent } from "@/hooks/useGameAccent";
import { DEFAULT_PALETTE } from "@/lib/utils/accent-palette";

describe("useGameAccent", () => {
  it("accepts a hex string directly", () => {
    const { result } = renderHook(() => useGameAccent("#ff4655"));
    expect(result.current.rgbTriplet).toBe("255 70 85");
    expect(result.current.name).toBe("custom");
  });

  it("accepts an object with an accentColor field", () => {
    const game = { accentColor: "#ff4655" };
    const { result } = renderHook(() => useGameAccent(game));
    expect(result.current.rgbTriplet).toBe("255 70 85");
  });

  it("returns DEFAULT_PALETTE when input is null", () => {
    const { result } = renderHook(() => useGameAccent(null));
    expect(result.current).toBe(DEFAULT_PALETTE);
  });

  it("returns DEFAULT_PALETTE when input is undefined", () => {
    const { result } = renderHook(() => useGameAccent(undefined));
    expect(result.current).toBe(DEFAULT_PALETTE);
  });

  it("returns DEFAULT_PALETTE when accentColor is null on the game object", () => {
    const game = { accentColor: null };
    const { result } = renderHook(() => useGameAccent(game));
    expect(result.current).toBe(DEFAULT_PALETTE);
  });

  it("returns DEFAULT_PALETTE when accentColor is missing on the game object", () => {
    const game = { name: "Some Game" };
    const { result } = renderHook(() => useGameAccent(game as { accentColor?: string }));
    expect(result.current).toBe(DEFAULT_PALETTE);
  });

  it("uses the provided palette name", () => {
    const { result } = renderHook(() => useGameAccent("#ff4655", "valorant"));
    expect(result.current.name).toBe("valorant");
  });

  it("memoizes the palette across re-renders with the same hex", () => {
    const { result, rerender } = renderHook(({ hex }) => useGameAccent(hex), {
      initialProps: { hex: "#ff4655" },
    });
    const first = result.current;
    rerender({ hex: "#ff4655" });
    expect(result.current).toBe(first);
  });

  it("regenerates the palette when the hex changes", () => {
    const { result, rerender } = renderHook(({ hex }) => useGameAccent(hex), {
      initialProps: { hex: "#ff4655" },
    });
    const first = result.current;
    rerender({ hex: "#0066cc" });
    expect(result.current).not.toBe(first);
    expect(result.current.rgbTriplet).toBe("0 102 204");
  });

  it("regenerates the palette when the game object changes its accentColor", () => {
    const { result, rerender } = renderHook(({ game }) => useGameAccent(game), {
      initialProps: { game: { accentColor: "#ff4655" } as { accentColor: string | null } },
    });
    const first = result.current;
    rerender({ game: { accentColor: "#0066cc" } });
    expect(result.current).not.toBe(first);
    expect(result.current.rgbTriplet).toBe("0 102 204");
  });
});
