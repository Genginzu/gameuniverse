import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient, apiClient } from "../../../src/lib/api-client";
import { ErrorType } from "../../../src/lib/error-handling";

describe("api-client", () => {
  let originalFetch: typeof fetch;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleWarnSpy.mockRestore();
  });

  describe("ApiClient", () => {
    describe("constructor", () => {
      it("should create client with default config", () => {
        const client = new ApiClient();
        expect(client).toBeDefined();
      });

      it("should create client with custom config", () => {
        const client = new ApiClient({
          baseURL: "https://api.example.com",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 2,
            baseDelay: 500,
            maxDelay: 2000,
            backoffMultiplier: 1.5,
            retryableErrors: [ErrorType.NETWORK],
          },
        });
        expect(client).toBeDefined();
      });
    });

    describe("call", () => {
      it("should make successful GET request", async () => {
        const mockResponse = { data: "test" };
        globalThis.fetch = vi.fn(async () => ({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => mockResponse,
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });
        const result = await client.call("/test");

        expect(result).toEqual(mockResponse);
      });

      it("should handle non-JSON responses", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: true,
          headers: new Headers({ "content-type": "text/plain" }),
          text: async () => "plain text response",
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });
        const result = await client.call("/test");

        expect(result).toEqual({ text: "plain text response" });
      });

      it("should handle absolute URLs", async () => {
        const mockFetch = vi.fn(async () => ({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        })) as typeof fetch;
        globalThis.fetch = mockFetch;

        const client = new ApiClient({
          baseURL: "https://base.com",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });
        await client.call("https://other.com/api");

        expect(mockFetch).toHaveBeenCalledWith("https://other.com/api", expect.any(Object));
      });

      it("should throw timeout error on abort", async () => {
        globalThis.fetch = vi.fn(async () => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          throw error;
        }) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 100,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.NETWORK,
          retryable: true,
        });
      });

      it("should handle 400 validation errors", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: false,
          status: 400,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ error: "Invalid input" }),
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.VALIDATION,
          statusCode: 400,
        });
      });

      it("should handle 401 authentication errors", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ message: "Unauthorized" }),
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.AUTHENTICATION,
          statusCode: 401,
        });
      });

      it("should handle 403 authorization errors", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: false,
          status: 403,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({}),
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.AUTHORIZATION,
          statusCode: 403,
        });
      });

      it("should handle 404 not found errors", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: false,
          status: 404,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({}),
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.NOT_FOUND,
          statusCode: 404,
        });
      });

      it("should handle 500 server errors", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({}),
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.SERVER,
          statusCode: 500,
          retryable: true,
        });
      });

      it("should handle network errors", async () => {
        globalThis.fetch = vi.fn(async () => {
          throw new TypeError("fetch failed");
        }) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.NETWORK,
          retryable: true,
        });
      });

      it("should handle JSON parse errors", async () => {
        globalThis.fetch = vi.fn(async () => ({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => {
            throw new Error("Invalid JSON");
          },
        })) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        await expect(client.call("/test")).rejects.toMatchObject({
          type: ErrorType.SERVER,
        });
      });

      it("should skip error handling when skipErrorHandling is true", async () => {
        globalThis.fetch = vi.fn(async () => {
          throw new Error("Raw error");
        }) as typeof fetch;

        const client = new ApiClient({
          baseURL: "",
          timeout: 5000,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryableErrors: [],
          },
        });

        // With skipErrorHandling, the error is rethrown but still goes through withRetry
        await expect(client.call("/test", { skipErrorHandling: true })).rejects.toMatchObject({
          message: "Raw error",
        });
      });
    });
  });
});

describe("HTTP methods", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("get", () => {
    it("should make GET request", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      const client = new ApiClient({
        baseURL: "",
        timeout: 5000,
        retryConfig: {
          maxAttempts: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });
      await client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith("/test", expect.objectContaining({ method: "GET" }));
    });
  });

  describe("post", () => {
    it("should make POST request with JSON body", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      const client = new ApiClient({
        baseURL: "",
        timeout: 5000,
        retryConfig: {
          maxAttempts: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });
      await client.post("/test", { name: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        })
      );
    });

    it("should make POST request without body", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      const client = new ApiClient({
        baseURL: "",
        timeout: 5000,
        retryConfig: {
          maxAttempts: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });
      await client.post("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({
          method: "POST",
          body: undefined,
        })
      );
    });
  });

  describe("put", () => {
    it("should make PUT request with JSON body", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ updated: true }),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      const client = new ApiClient({
        baseURL: "",
        timeout: 5000,
        retryConfig: {
          maxAttempts: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });
      await client.put("/test/1", { name: "updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/test/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "updated" }),
        })
      );
    });
  });

  describe("patch", () => {
    it("should make PATCH request with JSON body", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ patched: true }),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      const client = new ApiClient({
        baseURL: "",
        timeout: 5000,
        retryConfig: {
          maxAttempts: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });
      await client.patch("/test/1", { status: "active" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/test/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "active" }),
        })
      );
    });
  });

  describe("delete", () => {
    it("should make DELETE request", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ deleted: true }),
      })) as typeof fetch;
      globalThis.fetch = mockFetch;

      const client = new ApiClient({
        baseURL: "",
        timeout: 5000,
        retryConfig: {
          maxAttempts: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });
      await client.delete("/test/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "/test/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});

describe("apiClient singleton", () => {
  it("should export a default apiClient instance", () => {
    expect(apiClient).toBeDefined();
    expect(apiClient).toBeInstanceOf(ApiClient);
  });
});

describe("useApiClient hook", () => {
  it("should return the apiClient instance", async () => {
    const { useApiClient } = await import("../../../src/lib/api-client");
    const client = useApiClient();
    expect(client).toBe(apiClient);
  });
});
