"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import type { AdminShowcaseItem, HomeShowcaseKind, ShowcaseLibraryStatus } from "@/types/home";

const ENDPOINT = "/api/admin/home-showcase";
const KNOWN_ERRORS = new Set(["limit", "duplicate", "notFound", "invalid", "database", "import"]);

/** Error code returned by the admin API (`limit`, `duplicate`, …) or `null` on success. */
export type ShowcaseMutationError = string | null;

async function send(url: string, method: string, body?: unknown): Promise<ShowcaseMutationError> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.ok) return null;
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  return payload.error && KNOWN_ERRORS.has(payload.error) ? payload.error : "database";
}

/** Imports an IGDB game (or returns the existing local one), then adds it to the showcase. */
async function importThenAdd(igdbId: number): Promise<ShowcaseMutationError> {
  const response = await fetch("/api/games/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ igdbId }),
  });
  const payload = (await response.json().catch(() => ({}))) as { game?: { id?: string } };
  if (!response.ok || !payload.game?.id) return "import";
  return send(ENDPOINT, "POST", { kind: "game", entityId: payload.game.id });
}

/** Swaps the item at `index` with its neighbour in `direction` (-1 up, +1 down). */
export function moveId(ids: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function useAdminHomeShowcase() {
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWR<{ items: AdminShowcaseItem[] }>(
    `${ENDPOINT}?locale=${locale}`,
    fetcher
  );
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (action: () => Promise<ShowcaseMutationError>) => {
      setPending(true);
      try {
        const result = await action();
        await mutate();
        return result;
      } finally {
        setPending(false);
      }
    },
    [mutate]
  );

  const items = data?.items ?? [];
  const itemsOf = (kind: HomeShowcaseKind) => items.filter((item) => item.kind === kind);

  return {
    itemsOf,
    isLoading,
    loadError: error ? String(error) : null,
    pending,
    add: (kind: HomeShowcaseKind, entityId: string) =>
      run(() => send(ENDPOINT, "POST", { kind, entityId })),
    importAndAdd: (igdbId: number) => run(() => importThenAdd(igdbId)),
    remove: (id: string) => run(() => send(`${ENDPOINT}/${id}`, "DELETE")),
    setStatus: (id: string, libraryStatus: ShowcaseLibraryStatus) =>
      run(() => send(`${ENDPOINT}/${id}`, "PATCH", { libraryStatus })),
    move: (kind: HomeShowcaseKind, index: number, direction: -1 | 1) => {
      const ids = moveId(
        itemsOf(kind).map((item) => item.id),
        index,
        direction
      );
      return run(() => send(ENDPOINT, "PUT", { kind, ids }));
    },
  };
}
