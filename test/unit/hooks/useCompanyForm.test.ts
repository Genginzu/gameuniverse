import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock next-intl before importing the hook
vi.mock("next-intl", () => ({
  useLocale: () => "fr",
}));

// Mock i18n/routing
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en"], defaultLocale: "fr" },
}));

// Static import — module resolved once for the entire file
import { useCompanyForm } from "../../../src/hooks/useCompanyForm";

const originalFetch = globalThis.fetch;

const sampleCompanyData = {
  name: "CD Projekt Red",
  slug: "cd-projekt-red",
  company_type: "developer" as const,
  website_url: "https://cdprojektred.com",
  logo_url: "",
  founded_year: 2002,
  headquarters: "Warsaw",
};

describe("useCompanyForm", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            company: { id: "c1", ...sampleCompanyData, gameCount: 0 },
          }),
      })
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with default values in create mode", () => {
    const { result } = renderHook(() => useCompanyForm("create"));

    const values = result.current.form.getValues();
    expect(values.name).toBe("");
    expect(values.slug).toBe("");
    expect(values.company_type).toBe("both");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("should initialize with initialData in edit mode", () => {
    const { result } = renderHook(() => useCompanyForm("edit", sampleCompanyData));

    expect(result.current.form.getValues().name).toBe("CD Projekt Red");
    expect(result.current.form.getValues().slug).toBe("cd-projekt-red");
    expect(result.current.form.getValues().company_type).toBe("developer");
  });

  it("should POST to /api/admin/companies in create mode", async () => {
    const { result } = renderHook(() => useCompanyForm("create"));

    await act(async () => {
      await result.current.submitCompany(sampleCompanyData);
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    expect(calls.length).toBe(1);

    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/companies");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.name).toBe("CD Projekt Red");
    expect(body.slug).toBe("cd-projekt-red");
  });

  it("should PUT to /api/admin/companies/[slug] in edit mode without slug in body", async () => {
    const { result } = renderHook(() => useCompanyForm("edit", sampleCompanyData));

    await act(async () => {
      await result.current.submitCompany(sampleCompanyData);
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    expect(calls.length).toBe(1);

    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/companies/cd-projekt-red");
    expect(options.method).toBe("PUT");

    const body = JSON.parse(options.body as string);
    // Slug should NOT be in the PUT payload
    expect(body.slug).toBeUndefined();
    expect(body.name).toBe("CD Projekt Red");
  });

  it("should set submitError on API failure and throw", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "A company with this name or slug already exists" }),
      })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useCompanyForm("create"));

    const submitPromise = result.current.submitCompany(sampleCompanyData);

    await expect(submitPromise).rejects.toThrow("A company with this name or slug already exists");

    await waitFor(() => {
      expect(result.current.submitError).toBe("A company with this name or slug already exists");
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it("should set submitError on network failure", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useCompanyForm("create"));

    const submitPromise = result.current.submitCompany(sampleCompanyData);

    await expect(submitPromise).rejects.toThrow("Network error");

    await waitFor(() => {
      expect(result.current.submitError).toBe("Network error");
    });
  });
});
