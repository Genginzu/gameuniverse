"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import {
  claimInFlight,
  releaseInFlight,
  type AffectedKey,
  type OptimisticMutationSpec,
} from "@/lib/swr/optimistic";

export type { OptimisticMutationSpec };

export interface OptimisticMutation<Args, Result> {
  /** Resolves with the request result, `undefined` when ignored as in-flight; rejects after rollback. */
  trigger: (args: Args) => Promise<Result | undefined>;
  isPending: boolean;
}

/**
 * Optimistic mutation over the SWR cache. Snapshot, rollback and race handling
 * per key are delegated to SWR's `optimisticData` / `rollbackOnError`; this hook
 * adds multi-key rollback, in-flight toggle dedupe and related-key revalidation.
 */
export function useOptimisticMutation<Args = void, Result = unknown>(
  spec: OptimisticMutationSpec<Args, Result>
): OptimisticMutation<Args, Result> {
  const { cache, mutate } = useSWRConfig();
  const [pendingCount, setPendingCount] = useState(0);
  const specRef = useRef(spec);

  useEffect(() => {
    specRef.current = spec;
  });

  const trigger = useCallback(
    async (args: Args) => {
      const { request, affects, related, dedupeId } = specRef.current;
      const id = dedupeId?.(args) ?? null;
      if (id !== null && !claimInFlight(cache, id)) return undefined;

      setPendingCount((count) => count + 1);
      try {
        const affected = (affects?.(args) ?? []).filter(
          (entry): entry is AffectedKey & { key: string } => entry.key !== null
        );
        const response = request(args);
        const settled = response.then(() => undefined);

        // Every affected key shares the same request: SWR rolls each one back
        // to its committed value if it rejects.
        await Promise.allSettled(
          affected.map(({ key, update }) =>
            mutate(key, settled, {
              optimisticData: (committed: unknown) => update(committed),
              populateCache: (_result: unknown, committed: unknown) => update(committed),
              rollbackOnError: true,
              revalidate: false,
            })
          )
        );
        const result = await response;

        const affectedKeys = new Set(affected.map(({ key }) => key));
        const relatedFilters = related?.(args) ?? [];
        // Called with the filter only: SWR then revalidates matches without touching their data.
        await mutate(
          (key: unknown) =>
            (typeof key === "string" && affectedKeys.has(key)) ||
            relatedFilters.some((matches) => matches(key))
        );
        return result;
      } finally {
        if (id !== null) releaseInFlight(cache, id);
        setPendingCount((count) => count - 1);
      }
    },
    [cache, mutate]
  );

  return { trigger, isPending: pendingCount > 0 };
}
