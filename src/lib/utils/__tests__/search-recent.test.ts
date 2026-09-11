// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";

import {
  __TEST__,
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  removeRecentSearch,
} from "@/lib/utils/search-recent";

const STORAGE_KEY = __TEST__.STORAGE_KEY;
const MAX_ENTRIES = __TEST__.MAX_ENTRIES;

describe("search-recent: localStorage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("readRecentSearches", () => {
    it("returns an empty array when storage is empty", () => {
      expect(readRecentSearches()).toEqual([]);
    });

    it("returns persisted entries in insertion order", () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["a", "b", "c"]));
      expect(readRecentSearches()).toEqual(["a", "b", "c"]);
    });

    it("ignores corrupted JSON", () => {
      window.localStorage.setItem(STORAGE_KEY, "not-json{");
      expect(readRecentSearches()).toEqual([]);
    });

    it("ignores non-array stored values", () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
      expect(readRecentSearches()).toEqual([]);
    });

    it("filters out non-string entries", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(["valid", 42, null, "", "another"])
      );
      expect(readRecentSearches()).toEqual(["valid", "another"]);
    });

    it("trims to MAX_ENTRIES (defensive against legacy oversized lists)", () => {
      const oversized = Array.from({ length: MAX_ENTRIES + 5 }, (_, i) => `q${i}`);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(oversized));
      expect(readRecentSearches()).toHaveLength(MAX_ENTRIES);
    });
  });

  describe("addRecentSearch", () => {
    it("adds a single entry to an empty list", () => {
      const result = addRecentSearch("zelda");
      expect(result).toEqual(["zelda"]);
      expect(readRecentSearches()).toEqual(["zelda"]);
    });

    it("inserts the new entry at the top (most recent first)", () => {
      addRecentSearch("first");
      addRecentSearch("second");
      addRecentSearch("third");
      expect(readRecentSearches()).toEqual(["third", "second", "first"]);
    });

    it("trims the input before storing", () => {
      addRecentSearch("  zelda  ");
      expect(readRecentSearches()).toEqual(["zelda"]);
    });

    it("returns the current list unchanged when the trimmed input is empty", () => {
      addRecentSearch("zelda");
      const result = addRecentSearch("   ");
      expect(result).toEqual(["zelda"]);
      expect(readRecentSearches()).toEqual(["zelda"]);
    });

    it("deduplicates case-insensitively", () => {
      addRecentSearch("Zelda");
      addRecentSearch("mario");
      addRecentSearch("ZELDA"); // duplicate of "Zelda"
      // ZELDA should bubble up to the top, the original "Zelda" entry is removed
      expect(readRecentSearches()).toEqual(["ZELDA", "mario"]);
    });

    it("caps the list at MAX_ENTRIES", () => {
      for (let i = 0; i < MAX_ENTRIES + 3; i++) {
        addRecentSearch(`query-${i}`);
      }
      const list = readRecentSearches();
      expect(list).toHaveLength(MAX_ENTRIES);
      // Most recent (last added) is at the top
      expect(list[0]).toBe(`query-${MAX_ENTRIES + 2}`);
      // Oldest entries are dropped
      expect(list).not.toContain("query-0");
      expect(list).not.toContain("query-1");
      expect(list).not.toContain("query-2");
    });
  });

  describe("removeRecentSearch", () => {
    it("removes a matching entry", () => {
      addRecentSearch("a");
      addRecentSearch("b");
      addRecentSearch("c");
      const result = removeRecentSearch("b");
      expect(result).toEqual(["c", "a"]);
      expect(readRecentSearches()).toEqual(["c", "a"]);
    });

    it("matches case-insensitively", () => {
      addRecentSearch("Zelda");
      removeRecentSearch("zelda");
      expect(readRecentSearches()).toEqual([]);
    });

    it("is a no-op for an unknown query", () => {
      addRecentSearch("a");
      const result = removeRecentSearch("notpresent");
      expect(result).toEqual(["a"]);
    });

    it("returns the current list when the input is empty", () => {
      addRecentSearch("a");
      const result = removeRecentSearch("   ");
      expect(result).toEqual(["a"]);
    });
  });

  describe("clearRecentSearches", () => {
    it("removes the storage key entirely", () => {
      addRecentSearch("a");
      addRecentSearch("b");
      clearRecentSearches();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(readRecentSearches()).toEqual([]);
    });

    it("is a no-op when nothing is stored", () => {
      expect(() => clearRecentSearches()).not.toThrow();
    });
  });

  describe("graceful degradation", () => {
    it("ignores quota errors when adding (storage full / private mode)", () => {
      const original = window.localStorage.setItem;
      window.localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };
      try {
        // Should not throw — just silently fail to persist.
        expect(() => addRecentSearch("zelda")).not.toThrow();
      } finally {
        window.localStorage.setItem = original;
      }
    });
  });
});
