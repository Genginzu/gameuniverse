import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { clearAuthCookies } from "@/lib/auth-utils";

describe("auth-utils", () => {
  describe("clearAuthCookies", () => {
    let originalDocument: typeof document;
    let originalLocalStorage: typeof localStorage;
    let originalSessionStorage: typeof sessionStorage;
    let originalWindow: typeof window;

    beforeEach(() => {
      // Store originals
      originalDocument = globalThis.document;
      originalLocalStorage = globalThis.localStorage;
      originalSessionStorage = globalThis.sessionStorage;
      originalWindow = globalThis.window;
    });

    afterEach(() => {
      // Restore originals
      globalThis.document = originalDocument;
      globalThis.localStorage = originalLocalStorage;
      globalThis.sessionStorage = originalSessionStorage;
      globalThis.window = originalWindow;
    });

    it("should do nothing when window is undefined (server-side)", () => {
      // @ts-expect-error - Testing server-side scenario
      globalThis.window = undefined;

      // Should not throw
      expect(() => clearAuthCookies()).not.toThrow();
    });

    it("should clear Supabase cookies from document", () => {
      const mockCookies = "sb-token=abc123; other-cookie=value; supabase-auth=xyz";
      const clearedCookies: string[] = [];

      // @ts-expect-error - Mocking document
      globalThis.document = {
        get cookie() {
          return mockCookies;
        },
        set cookie(value: string) {
          clearedCookies.push(value);
        },
      };

      // @ts-expect-error - Mocking window
      globalThis.window = {
        location: { hostname: "localhost" },
      };

      // @ts-expect-error - Mocking localStorage
      globalThis.localStorage = {
        removeItem: vi.fn(),
        keys: () => [],
      };
      Object.keys = vi.fn(() => []);

      // @ts-expect-error - Mocking sessionStorage
      globalThis.sessionStorage = {};

      clearAuthCookies();

      // Should have cleared sb-token and supabase-auth cookies
      expect(clearedCookies.length).toBeGreaterThan(0);
      expect(clearedCookies.some((c) => c.includes("sb-token"))).toBe(true);
      expect(clearedCookies.some((c) => c.includes("supabase-auth"))).toBe(true);
    });

    it("should clear Supabase items from localStorage", () => {
      const removedItems: string[] = [];
      const localStorageKeys = ["sb-auth-token", "other-key", "supabase-session"];

      // @ts-expect-error - Mocking document
      globalThis.document = {
        cookie: "",
      };

      // @ts-expect-error - Mocking window
      globalThis.window = {
        location: { hostname: "localhost" },
      };

      // @ts-expect-error - Mocking localStorage
      globalThis.localStorage = {
        removeItem: (key: string) => removedItems.push(key),
      };

      // Mock Object.keys for localStorage
      const originalObjectKeys = Object.keys;
      Object.keys = (obj: object) => {
        if (obj === globalThis.localStorage) return localStorageKeys;
        if (obj === globalThis.sessionStorage) return [];
        return originalObjectKeys(obj);
      };

      // @ts-expect-error - Mocking sessionStorage
      globalThis.sessionStorage = {};

      clearAuthCookies();

      expect(removedItems).toContain("sb-auth-token");
      expect(removedItems).toContain("supabase-session");
      expect(removedItems).not.toContain("other-key");

      Object.keys = originalObjectKeys;
    });

    it("should clear Supabase items from sessionStorage", () => {
      const removedItems: string[] = [];
      const sessionStorageKeys = ["sb-refresh-token", "other-session", "supabase-data"];

      // @ts-expect-error - Mocking document
      globalThis.document = {
        cookie: "",
      };

      // @ts-expect-error - Mocking window
      globalThis.window = {
        location: { hostname: "localhost" },
      };

      // @ts-expect-error - Mocking localStorage
      globalThis.localStorage = {
        removeItem: vi.fn(),
      };

      // @ts-expect-error - Mocking sessionStorage
      globalThis.sessionStorage = {
        removeItem: (key: string) => removedItems.push(key),
      };

      const originalObjectKeys = Object.keys;
      Object.keys = (obj: object) => {
        if (obj === globalThis.localStorage) return [];
        if (obj === globalThis.sessionStorage) return sessionStorageKeys;
        return originalObjectKeys(obj);
      };

      clearAuthCookies();

      expect(removedItems).toContain("sb-refresh-token");
      expect(removedItems).toContain("supabase-data");
      expect(removedItems).not.toContain("other-session");

      Object.keys = originalObjectKeys;
    });
  });
});
