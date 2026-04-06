import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["fr", "en"] } }));

import { useRoleForm } from "@/hooks/useRoleForm";

describe("useRoleForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default values in create mode", () => {
    const { result } = renderHook(() => useRoleForm("create"));
    const values = result.current.form.getValues();
    expect(values.slug).toBe("");
    expect(values.translations).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("submits POST to /api/admin/roles in create mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRoleForm("create"));
    const data = { slug: "director", translations: [{ language_code: "fr", name: "Réalisateur" }] };

    await act(() => result.current.submitRole(data));

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/roles", expect.objectContaining({ method: "POST" }));
  });

  it("submits PUT to /api/admin/roles/{slug} in edit mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRoleForm("edit"));
    const data = { slug: "director", translations: [{ language_code: "fr", name: "Réalisateur" }] };

    await act(() => result.current.submitRole(data));

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/roles/director", expect.objectContaining({ method: "PUT" }));
  });

  it("sets submitError on failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Not found" }) });
    const { result } = renderHook(() => useRoleForm("create"));
    const data = { slug: "director", translations: [{ language_code: "fr", name: "Réalisateur" }] };

    await act(async () => {
      await result.current.submitRole(data).catch(() => {});
    });
    expect(result.current.submitError).toBe("Not found");
  });
});
