import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import {
  EDITORIAL_RAIL_STORAGE_KEY,
  readPersistedSpace,
  useEditorialRailState,
  writePersistedSpace,
} from "@/hooks/useEditorialRailState";

describe("useEditorialRailState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("initial state", () => {
    it("starts with openSpace=null when localStorage is empty", () => {
      const { result } = renderHook(() => useEditorialRailState());
      expect(result.current.openSpace).toBeNull();
    });

    it("hydrates from localStorage when a valid space is persisted", () => {
      writePersistedSpace("esport");
      const { result } = renderHook(() => useEditorialRailState());
      expect(result.current.openSpace).toBe("esport");
    });

    it("ignores invalid persisted values and starts closed", () => {
      // Manually plant an invalid key
      window.localStorage.setItem(
        EDITORIAL_RAIL_STORAGE_KEY,
        JSON.stringify("not-a-real-space")
      );
      const { result } = renderHook(() => useEditorialRailState());
      expect(result.current.openSpace).toBeNull();
    });

    it("ignores corrupted JSON and starts closed", () => {
      window.localStorage.setItem(EDITORIAL_RAIL_STORAGE_KEY, "{not valid json");
      const { result } = renderHook(() => useEditorialRailState());
      expect(result.current.openSpace).toBeNull();
    });

    it("flips hydrated to true after mount", () => {
      const { result } = renderHook(() => useEditorialRailState());
      // After the synchronous mount + effects flush, hydrated must be true.
      expect(result.current.hydrated).toBe(true);
    });
  });

  describe("toggleSpace", () => {
    it("opens a space from the closed state", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.toggleSpace("games"));
      expect(result.current.openSpace).toBe("games");
    });

    it("closes the same space when toggled twice", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.toggleSpace("games"));
      act(() => result.current.toggleSpace("games"));
      expect(result.current.openSpace).toBeNull();
    });

    it("switches to another space when toggling a different key", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.toggleSpace("games"));
      act(() => result.current.toggleSpace("esport"));
      expect(result.current.openSpace).toBe("esport");
    });
  });

  describe("closeSpace", () => {
    it("forces closure regardless of current state", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.toggleSpace("library"));
      act(() => result.current.closeSpace());
      expect(result.current.openSpace).toBeNull();
    });

    it("is a no-op when already closed", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.closeSpace());
      expect(result.current.openSpace).toBeNull();
    });
  });

  describe("openSpaceKey", () => {
    it("force-opens a specific space (does not toggle)", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.openSpaceKey("coaching"));
      act(() => result.current.openSpaceKey("coaching"));
      // Still open after a second call (unlike toggleSpace).
      expect(result.current.openSpace).toBe("coaching");
    });
  });

  describe("persistance", () => {
    it("writes openSpace to localStorage after a toggle", () => {
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.toggleSpace("community"));
      expect(readPersistedSpace()).toBe("community");
    });

    it("writes null to localStorage when closed", () => {
      writePersistedSpace("games");
      const { result } = renderHook(() => useEditorialRailState());
      act(() => result.current.closeSpace());
      expect(readPersistedSpace()).toBeNull();
    });

    it("restores the persisted value on a fresh hook instance", () => {
      writePersistedSpace("library");
      const { result } = renderHook(() => useEditorialRailState());
      expect(result.current.openSpace).toBe("library");
    });
  });
});

describe("readPersistedSpace / writePersistedSpace (helpers)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("readPersistedSpace returns null when nothing is stored", () => {
    expect(readPersistedSpace()).toBeNull();
  });

  it("writePersistedSpace stores the value as JSON", () => {
    writePersistedSpace("esport");
    const raw = window.localStorage.getItem(EDITORIAL_RAIL_STORAGE_KEY);
    expect(raw).toBe(JSON.stringify("esport"));
  });

  it("round-trips a value through write + read", () => {
    writePersistedSpace("games");
    expect(readPersistedSpace()).toBe("games");
  });

  it("returns null when the persisted value is not a known space", () => {
    window.localStorage.setItem(
      EDITORIAL_RAIL_STORAGE_KEY,
      JSON.stringify("ghost-space")
    );
    expect(readPersistedSpace()).toBeNull();
  });

  it("returns null when the persisted value is JSON null", () => {
    window.localStorage.setItem(EDITORIAL_RAIL_STORAGE_KEY, JSON.stringify(null));
    expect(readPersistedSpace()).toBeNull();
  });

  describe("error tolerance", () => {
    let originalGetItem: typeof window.localStorage.getItem;
    let originalSetItem: typeof window.localStorage.setItem;

    afterEach(() => {
      if (originalGetItem) window.localStorage.getItem = originalGetItem;
      if (originalSetItem) window.localStorage.setItem = originalSetItem;
    });

    it("readPersistedSpace returns null when localStorage throws (e.g. private mode)", () => {
      originalGetItem = window.localStorage.getItem.bind(window.localStorage);
      window.localStorage.getItem = vi.fn(() => {
        throw new Error("Access denied");
      });
      expect(readPersistedSpace()).toBeNull();
    });

    it("writePersistedSpace silently swallows errors (e.g. quota exceeded)", () => {
      originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      window.localStorage.setItem = vi.fn(() => {
        throw new Error("Quota exceeded");
      });
      expect(() => writePersistedSpace("games")).not.toThrow();
    });
  });
});
