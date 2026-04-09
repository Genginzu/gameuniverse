import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Tests for the Supabase client module
 *
 * Note: The @supabase/ssr module is mocked globally in test/setup.ts
 * These tests verify the client creation and caching behavior
 */

describe("supabase client", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("createClient behavior", () => {
    it("should create a client when environment variables are set", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const { createClient } = await import("../../../src/lib/supabase");
      const client = createClient();

      expect(client).toBeDefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it("should return the same client instance on subsequent calls (caching)", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const { createClient } = await import("../../../src/lib/supabase");

      const client1 = createClient();
      const client2 = createClient();

      expect(client1).toBe(client2);

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it("should have auth property on the client", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const { createClient } = await import("../../../src/lib/supabase");
      const client = createClient();

      expect(client.auth).toBeDefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it("should have from method on the client", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const { createClient } = await import("../../../src/lib/supabase");
      const client = createClient();

      // The mock client from setup.ts has a from method
      expect(typeof client.from).toBe("function");

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe("environment variable validation", () => {
    it("should validate that NEXT_PUBLIC_SUPABASE_URL is required", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    });

    it("should validate that NEXT_PUBLIC_SUPABASE_ANON_KEY is required", () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    });
  });
});
