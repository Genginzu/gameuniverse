/** Selects cache keys to revalidate; receives the original (unserialized) SWR key. */
export type KeyFilter = (key: unknown) => boolean;

/** One affected key and the pure function predicting its value once the server confirms. */
export interface AffectedKey<Data = unknown> {
  key: string | null;
  update: (current: Data | undefined) => Data | undefined;
}

/** Builds a typed affected key; keeps call sites free of casts. */
export function affect<Data>(
  key: string | null,
  update: (current: Data | undefined) => Data | undefined
): AffectedKey {
  return { key, update: update as AffectedKey["update"] };
}

/** Matches string keys starting with `prefix`. */
export function keyStartsWith(prefix: string): KeyFilter {
  return (key) => typeof key === "string" && key.startsWith(prefix);
}

/** Matches one exact string key. */
export function keyEquals(expected: string): KeyFilter {
  return (key) => key === expected;
}

/** What an optimistic mutation sends, predicts, revalidates and dedupes. */
export interface OptimisticMutationSpec<Args, Result> {
  /** Server request; must reject on any non-2xx status or network failure. */
  request: (args: Args) => Promise<Result>;
  /** Affected keys shown with their predicted value until the server answers. */
  affects?: (args: Args) => AffectedKey[];
  /** Related keys revalidated once the server confirms. */
  related?: (args: Args) => KeyFilter[];
  /** In-flight toggles sharing this id are ignored until the first one settles. */
  dedupeId?: (args: Args) => string | null;
}

// In-flight toggles are tracked per SWR cache so that two hook instances on the
// same page share them, while isolated test caches never leak into each other.
const inFlightByCache = new WeakMap<object, Set<string>>();

/** Claims `id` for `cache`; returns false when a toggle with that id is already in flight. */
export function claimInFlight(cache: object, id: string): boolean {
  const inFlight = inFlightByCache.get(cache) ?? new Set<string>();
  inFlightByCache.set(cache, inFlight);
  if (inFlight.has(id)) return false;
  inFlight.add(id);
  return true;
}

export function releaseInFlight(cache: object, id: string): void {
  inFlightByCache.get(cache)?.delete(id);
}
