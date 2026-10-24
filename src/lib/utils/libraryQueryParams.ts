export const LIBRARY_STATUSES = ["owned", "wishlist", "completed", "playing"] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

const MAX_LIMIT = 100;

export interface LibraryQueryParams {
  status: LibraryStatus | null;
  limit: number | null;
}

/**
 * Optional filters of `GET /api/library`. Unknown statuses and invalid limits
 * are ignored (full library), limits are clamped to `MAX_LIMIT`.
 */
export function parseLibraryQueryParams(searchParams: URLSearchParams): LibraryQueryParams {
  const rawStatus = searchParams.get("status");
  const status = LIBRARY_STATUSES.find((value) => value === rawStatus) ?? null;

  const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : null;

  return { status, limit };
}

export function buildLibraryUrl(params: Partial<LibraryQueryParams> = {}): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString();
  return suffix ? `/api/library?${suffix}` : "/api/library";
}
