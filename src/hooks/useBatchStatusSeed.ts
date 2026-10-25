"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";

interface BatchStatusSeedOptions<Data> {
  /** Entity ids (game ids, character slugs) displayed on the page. */
  ids: string[];
  enabled: boolean;
  /** POST endpoint returning `{ statuses: Record<id, boolean> }`. */
  url: string;
  /** Request body field carrying the ids. */
  bodyField: string;
  /** SWR key of one entity's status. */
  keyFor: (id: string) => string;
  /** Builds one entity's cached data; `body` is the full batch response (extra per-id maps). */
  toData: (status: boolean, id: string, body: Record<string, unknown>) => Data;
}

/**
 * Fetches many statuses in one request and seeds each per-entity SWR key, so
 * per-entity hooks read (and optimistically mutate) one shared cache.
 * `isSeeding(id)` tells those hooks to wait instead of fetching individually.
 */
export function useBatchStatusSeed<Data>({
  ids,
  enabled,
  url,
  bodyField,
  keyFor,
  toData,
}: BatchStatusSeedOptions<Data>) {
  const { cache, mutate } = useSWRConfig();
  const idsKey = ids.join(",");
  const [seededIdsKey, setSeededIdsKey] = useState<string | null>(null);
  const covered = useMemo(() => new Set(idsKey ? idsKey.split(",") : []), [idsKey]);

  useEffect(() => {
    if (!enabled || !idsKey) return;
    let cancelled = false;
    const requestedIds = idsKey.split(",");

    const seed = async () => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [bodyField]: requestedIds }),
        });
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as Record<string, unknown> & {
          statuses?: Record<string, boolean>;
        };
        const statuses = body.statuses ?? {};
        await Promise.all(
          Object.entries(statuses).map(([id, status]) =>
            mutate(keyFor(id), toData(status, id, body), { revalidate: false })
          )
        );
      } catch {
        // Fall back to per-entity fetching once seeding is over.
      } finally {
        if (!cancelled) setSeededIdsKey(idsKey);
      }
    };

    seed();
    return () => {
      cancelled = true;
    };
  }, [enabled, idsKey, url, bodyField, keyFor, toData, mutate]);

  return useCallback(
    (id: string) =>
      enabled &&
      covered.has(id) &&
      seededIdsKey !== idsKey &&
      cache.get(keyFor(id))?.data === undefined,
    [enabled, covered, seededIdsKey, idsKey, cache, keyFor]
  );
}
