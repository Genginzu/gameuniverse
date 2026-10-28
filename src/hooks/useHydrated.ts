"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False during the server render and the hydration pass, true once React runs in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
