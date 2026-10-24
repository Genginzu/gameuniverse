import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { z } from "zod";

import { useAdminEntityForm } from "@/hooks/useAdminEntityForm";
import { defineAdminForm } from "@/lib/admin-resource/defineAdminForm";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";

const schema = z.object({ slug: z.string(), name: z.string() });
type Data = z.infer<typeof schema>;

const bySlug = defineAdminForm<Data>({
  schema,
  path: "/api/admin/genres",
  defaultValues: () => ({ slug: "", name: "" }),
  editKey: (data) => data.slug,
  toPayload: (data, mode) => (mode === "create" ? data : { name: data.name }),
});

const byId = defineAdminForm<Data>({
  schema,
  path: ({ systemId }) => `/api/admin/age-classifications/${systemId}/ratings`,
  defaultValues: () => ({ slug: "", name: "" }),
});

const originalFetch = globalThis.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const mutations = () =>
  mockFetch.mock.calls
    .filter(([, init]) => init?.method)
    .map(([url, init]) => ({ call: `${init.method} ${url}`, body: JSON.parse(init.body) }));

describe("useAdminEntityForm", () => {
  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(json({ ok: true })));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("starts from the default values and exposes the site locales", () => {
    const { result } = renderHook(() => useAdminEntityForm(bySlug, "create"), {
      wrapper: createSWRWrapper(),
    });
    expect(result.current.form.getValues()).toEqual({ slug: "", name: "" });
    expect(result.current.supportedLanguages.map((lang) => lang.code)).toEqual(["fr", "en"]);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("creates with a POST on the collection", async () => {
    const { result } = renderHook(() => useAdminEntityForm(bySlug, "create"), {
      wrapper: createSWRWrapper(),
    });
    await act(() => result.current.submit({ slug: "rpg", name: "RPG" }));
    expect(mutations()).toEqual([
      { call: "POST /api/admin/genres", body: { slug: "rpg", name: "RPG" } },
    ]);
  });

  it("edits with a PUT on the item keyed by the form data", async () => {
    const { result } = renderHook(() => useAdminEntityForm(bySlug, "edit"), {
      wrapper: createSWRWrapper(),
    });
    await act(() => result.current.submit({ slug: "action rpg", name: "Action" }));
    expect(mutations()).toEqual([
      { call: "PUT /api/admin/genres/action%20rpg", body: { name: "Action" } },
    ]);
  });

  it("edits a nested item keyed by the given id and sends the data as-is", async () => {
    const { result } = renderHook(
      () => useAdminEntityForm(byId, "edit", { id: "r1", pathParams: { systemId: "pegi" } }),
      { wrapper: createSWRWrapper() }
    );
    await act(() => result.current.submit({ slug: "12", name: "PEGI 12" }));
    expect(mutations()).toEqual([
      {
        call: "PUT /api/admin/age-classifications/pegi/ratings/r1",
        body: { slug: "12", name: "PEGI 12" },
      },
    ]);
  });

  it("rejects with the API error and resets the submitting flag", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(json({ error: "Slug already exists" }, 409))
    );
    const { result } = renderHook(() => useAdminEntityForm(bySlug, "create"), {
      wrapper: createSWRWrapper(),
    });
    await act(async () => {
      await expect(result.current.submit({ slug: "rpg", name: "RPG" })).rejects.toThrow(
        "Slug already exists"
      );
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("revalidates the cached lists of the collection after a successful submit", async () => {
    const listUrl = "/api/admin/genres?page=1&limit=20";
    const { result } = renderHook(
      () => ({ list: useSWR(listUrl), form: useAdminEntityForm(bySlug, "create") }),
      { wrapper: createSWRWrapper() }
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());
    const listFetches = () => mockFetch.mock.calls.filter(([url]) => url === listUrl).length;
    expect(listFetches()).toBe(1);

    await act(() => result.current.form.submit({ slug: "rpg", name: "RPG" }));

    await waitFor(() => expect(listFetches()).toBe(2));
  });

  it("resets to new initial data but ignores identical re-renders", () => {
    const { result, rerender } = renderHook(
      ({ initialData }) => useAdminEntityForm(bySlug, "edit", { initialData }),
      {
        wrapper: createSWRWrapper(),
        initialProps: { initialData: undefined as Data | undefined },
      }
    );

    rerender({ initialData: { slug: "rpg", name: "RPG" } });
    expect(result.current.form.getValues()).toEqual({ slug: "rpg", name: "RPG" });

    act(() => result.current.form.setValue("name", "Edited"));
    rerender({ initialData: { slug: "rpg", name: "RPG" } });
    expect(result.current.form.getValues("name")).toBe("Edited");
  });
});
