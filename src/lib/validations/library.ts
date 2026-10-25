import { z } from "zod";

import type { LibraryStatus } from "@/types/library";

/** Statuses a player can pick, in menu order. */
export const LIBRARY_STATUSES = ["owned", "playing", "completed", "wishlist"] as const satisfies readonly LibraryStatus[];

export const libraryStatusSchema = z.enum(LIBRARY_STATUSES);

/** Body of `PATCH /api/library/[gameId]`. */
export const updateLibraryStatusSchema = z.object({
  status: libraryStatusSchema,
});

export const libraryGameParamsSchema = z.object({
  gameId: z.uuid(),
});

/** Narrows a stored status (free text column) to a known one, or `undefined`. */
export function toLibraryStatus(value: unknown): LibraryStatus | undefined {
  const parsed = libraryStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
