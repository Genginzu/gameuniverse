import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheSet, cacheInvalidate, cacheClear, invalidateForDeletedGame } from "@/lib/services/recommendation/cache";

beforeEach(() => {
  cacheClear();
});

describe("recommendation/cache", () => {
  it("set and get returns cached value", () => {
    cacheSet("key1", { foo: "bar" });
    expect(cacheGet("key1")).toEqual({ foo: "bar" });
  });

  it("returns null for missing key", () => {
    expect(cacheGet("missing")).toBeNull();
  });

  it("returns null for expired entry", () => {
    cacheSet("exp", "data", 1);
    // Advance time so the entry expires
    vi.useFakeTimers();
    vi.advanceTimersByTime(2);
    expect(cacheGet("exp")).toBeNull();
    vi.useRealTimers();
  });

  it("cacheInvalidate removes specific key", () => {
    cacheSet("a", 1);
    cacheSet("b", 2);
    cacheInvalidate("a");
    expect(cacheGet("a")).toBeNull();
    expect(cacheGet("b")).toBe(2);
  });

  it("cacheClear removes all entries", () => {
    cacheSet("x", 1);
    cacheSet("y", 2);
    cacheClear();
    expect(cacheGet("x")).toBeNull();
    expect(cacheGet("y")).toBeNull();
  });

  it("invalidateForDeletedGame removes game from lists", () => {
    cacheSet("game:g1", [{ id: "g1" }]);
    cacheSet("personal:u1", [{ id: "g1" }, { id: "g2" }]);
    invalidateForDeletedGame("g1");
    expect(cacheGet("game:g1")).toBeNull();
    const personal = cacheGet<any[]>("personal:u1");
    expect(personal).toEqual([{ id: "g2" }]);
  });

  it("invalidateForDeletedGame removes entry when list becomes empty", () => {
    cacheSet("game:g3", [{ id: "g5" }]);
    cacheSet("personal:u2", [{ id: "g5" }]);
    invalidateForDeletedGame("g5");
    expect(cacheGet("personal:u2")).toBeNull();
  });
});
