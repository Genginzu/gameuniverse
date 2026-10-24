import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import useSWR from "swr";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { jsonRequest } from "@/lib/utils/json-request";

interface Counter {
  value: number;
}

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const increment = (current: Counter | undefined) =>
  current ? { value: current.value + 1 } : current;

function useHarness() {
  const a = useSWR<Counter>("/a");
  const b = useSWR<Counter>("/b");
  const related = useSWR<Counter>("/related");
  const toggle = useOptimisticMutation<string, unknown>({
    request: () => jsonRequest("/toggle", "POST"),
    affects: () => [
      { key: "/a", update: increment },
      { key: "/b", update: increment },
    ],
    related: () => [(key) => key === "/related"],
    dedupeId: (target) => `toggle:${target}`,
  });
  const twin = useOptimisticMutation<string, unknown>({
    request: () => jsonRequest("/toggle", "POST"),
    dedupeId: (target) => `toggle:${target}`,
  });
  return { a: a.data, b: b.data, related: related.data, toggle, twin };
}

describe("useOptimisticMutation", () => {
  let mutationResponse: ReturnType<typeof deferred<Response>>;
  let relatedReads: number;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mutationResponse = deferred<Response>();
    relatedReads = 0;
    mockFetch = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "POST") return mutationResponse.promise;
      if (url === "/a") return Promise.resolve(jsonResponse({ value: 1 }));
      if (url === "/b") return Promise.resolve(jsonResponse({ value: 10 }));
      relatedReads += 1;
      return Promise.resolve(jsonResponse({ value: relatedReads }));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function renderLoaded() {
    const hook = renderHook(() => useHarness(), { wrapper: createSWRWrapper() });
    await waitFor(() => {
      expect(hook.result.current.a).toEqual({ value: 1 });
      expect(hook.result.current.b).toEqual({ value: 10 });
      expect(hook.result.current.related).toEqual({ value: 1 });
    });
    return hook;
  }

  function postCalls() {
    return mockFetch.mock.calls.filter(([, init]) => init?.method === "POST").length;
  }

  it("shows the optimistic value of every affected key before the server answers", async () => {
    const { result } = await renderLoaded();

    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.toggle.trigger("x");
    });

    await waitFor(() => {
      expect(result.current.a).toEqual({ value: 2 });
      expect(result.current.b).toEqual({ value: 11 });
      expect(result.current.toggle.isPending).toBe(true);
    });

    await act(async () => {
      mutationResponse.resolve(jsonResponse({ ok: true }));
      await pending;
    });
    expect(result.current.toggle.isPending).toBe(false);
  });

  it("rolls back every affected key and rejects when the server answers 4xx", async () => {
    const { result } = await renderLoaded();

    let outcome!: Promise<unknown>;
    act(() => {
      outcome = result.current.toggle.trigger("x").catch((error: Error) => error);
    });
    await waitFor(() => expect(result.current.a).toEqual({ value: 2 }));

    await act(async () => {
      mutationResponse.resolve(jsonResponse({ error: "Forbidden" }, 403));
      await outcome;
    });

    expect(await outcome).toEqual(new Error("Forbidden"));
    expect(result.current.a).toEqual({ value: 1 });
    expect(result.current.b).toEqual({ value: 10 });
  });

  it("rolls back every affected key and rejects on a network error", async () => {
    const { result } = await renderLoaded();

    let outcome!: Promise<unknown>;
    act(() => {
      outcome = result.current.toggle.trigger("x").catch((error: Error) => error);
    });
    await waitFor(() => expect(result.current.b).toEqual({ value: 11 }));

    await act(async () => {
      mutationResponse.reject(new TypeError("Failed to fetch"));
      await outcome;
    });

    expect(await outcome).toEqual(new TypeError("Failed to fetch"));
    expect(result.current.a).toEqual({ value: 1 });
    expect(result.current.b).toEqual({ value: 10 });
  });

  it("ignores a second toggle of the same target while the first is in flight", async () => {
    const { result } = await renderLoaded();

    let first!: Promise<unknown>;
    act(() => {
      first = result.current.toggle.trigger("x");
    });
    await act(async () => {
      await result.current.toggle.trigger("x");
      await result.current.twin.trigger("x");
    });

    expect(postCalls()).toBe(1);
    expect(result.current.a).toEqual({ value: 2 });

    await act(async () => {
      mutationResponse.resolve(jsonResponse({ ok: true }));
      await first;
    });
  });

  it("accepts a new toggle of the same target once the previous one settled", async () => {
    const { result } = await renderLoaded();
    mutationResponse.resolve(jsonResponse({ ok: true }));

    await act(async () => {
      await result.current.toggle.trigger("x");
      await result.current.toggle.trigger("x");
    });

    expect(postCalls()).toBe(2);
  });

  it("revalidates related keys after the server confirms", async () => {
    const { result } = await renderLoaded();
    mutationResponse.resolve(jsonResponse({ ok: true }));

    await act(async () => {
      await result.current.toggle.trigger("x");
    });

    await waitFor(() => expect(result.current.related).toEqual({ value: 2 }));
  });

  it("does not revalidate related keys when the mutation fails", async () => {
    const { result } = await renderLoaded();
    mutationResponse.resolve(jsonResponse({ error: "Nope" }, 422));

    await act(async () => {
      await result.current.toggle.trigger("x").catch(() => undefined);
    });

    expect(relatedReads).toBe(1);
    expect(result.current.related).toEqual({ value: 1 });
  });
});
