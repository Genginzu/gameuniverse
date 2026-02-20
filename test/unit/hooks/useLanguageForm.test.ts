import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Static import — module resolved once for the entire file
import { useLanguageForm } from "../../../src/hooks/useLanguageForm";

const originalFetch = globalThis.fetch;

describe("useLanguageForm", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            language: { code: "de", name: "German", native_name: "Deutsch" },
          }),
      })
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with default values in create mode", () => {
    const { result } = renderHook(() => useLanguageForm("create"));

    expect(result.current.form.getValues()).toEqual({
      code: "",
      name: "",
      native_name: "",
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("should initialize with initialData in edit mode", () => {
    const initialData = { code: "fr", name: "French", native_name: "Français" };
    const { result } = renderHook(() => useLanguageForm("edit", initialData));

    expect(result.current.form.getValues()).toEqual(initialData);
  });

  it("should POST to /api/admin/languages in create mode", async () => {
    const { result } = renderHook(() => useLanguageForm("create"));

    await act(async () => {
      await result.current.submitLanguage({
        code: "de",
        name: "German",
        native_name: "Deutsch",
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    expect(calls.length).toBe(1);

    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/languages");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.code).toBe("de");
    expect(body.name).toBe("German");
    expect(body.native_name).toBe("Deutsch");
  });

  it("should PUT to /api/admin/languages/[code] in edit mode", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            language: { code: "fr", name: "French Updated", native_name: "Français" },
          }),
      })
    ) as unknown as typeof fetch;

    const initialData = { code: "fr", name: "French", native_name: "Français" };
    const { result } = renderHook(() => useLanguageForm("edit", initialData));

    await act(async () => {
      await result.current.submitLanguage({
        code: "fr",
        name: "French Updated",
        native_name: "Français",
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    expect(calls.length).toBe(1);

    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/languages/fr");
    expect(options.method).toBe("PUT");

    const body = JSON.parse(options.body as string);
    expect(body.name).toBe("French Updated");
    expect(body.native_name).toBe("Français");
    // Code should NOT be in the PUT payload
    expect(body.code).toBeUndefined();
  });

  it("should set submitError on API failure and throw", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "A language with this code already exists" }),
      })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLanguageForm("create"));

    const submitPromise = result.current.submitLanguage({
      code: "en",
      name: "English",
      native_name: "English",
    });

    await expect(submitPromise).rejects.toThrow("A language with this code already exists");

    await waitFor(() => {
      expect(result.current.submitError).toBe("A language with this code already exists");
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it("should set submitError on network failure", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLanguageForm("create"));

    const submitPromise = result.current.submitLanguage({
      code: "de",
      name: "German",
      native_name: "",
    });

    await expect(submitPromise).rejects.toThrow("Network error");

    await waitFor(() => {
      expect(result.current.submitError).toBe("Network error");
    });
  });

  it("should reset submitError on new successful submission", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Server error" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            language: { code: "de", name: "German", native_name: "Deutsch" },
          }),
      });
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useLanguageForm("create"));

    const data = { code: "de", name: "German", native_name: "Deutsch" };

    // First submission fails
    const firstPromise = result.current.submitLanguage(data);
    await expect(firstPromise).rejects.toThrow("Server error");

    await waitFor(() => {
      expect(result.current.submitError).toBe("Server error");
    });

    // Second submission succeeds — error should be cleared
    await act(async () => {
      await result.current.submitLanguage(data);
    });

    expect(result.current.submitError).toBeNull();
  });

  it("should send empty string for native_name when not provided", async () => {
    const { result } = renderHook(() => useLanguageForm("create"));

    await act(async () => {
      await result.current.submitLanguage({
        code: "eo",
        name: "Esperanto",
        native_name: undefined,
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const [, options] = calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.native_name).toBe("");
  });
});
