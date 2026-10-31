"use client";

import useSWR from "swr";
import { buildLibraryUrl } from "@/lib/utils/libraryQueryParams";
import type { LibraryGame, LibraryResponse } from "@/types/library";

/** SWR key of the signed-in player's wishlist, translated in `locale`. */
export function wishlistKey(locale: string): string {
  return `${buildLibraryUrl({ status: "wishlist" })}&locale=${locale}`;
}

/**
 * Wishlist of the signed-in player: games wanted but not bought yet, most
 * recently wished first. Revalidated by every library mutation (its key starts
 * with `/api/library?`), so a game bought or removed leaves the list.
 */
export function useWishlist(locale: string, signedIn: boolean) {
  const { data, error, isLoading } = useSWR<LibraryResponse>(
    signedIn ? wishlistKey(locale) : null,
    { revalidateOnFocus: false }
  );

  const games: LibraryGame[] = (data?.games ?? []).filter(
    (game) => game.libraryStatus === "wishlist"
  );

  return { games, loading: isLoading, error };
}
