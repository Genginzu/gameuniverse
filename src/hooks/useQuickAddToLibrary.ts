"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";

import { useLibraryToggle } from "./useLibraryToggle";
import { useLibraryStatusChange } from "./useLibraryStatusChange";
import { toast } from "./use-toast";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { libraryStatusKey } from "@/lib/swr/keys";
import type { LibraryStatusResponse, QuickAction, QuickAddCallbacks } from "@/types/library";

// Seeded in batch by LibraryStatusProvider and revalidated after each toggle.
const STATUS_OPTIONS = { revalidateIfStale: false, revalidateOnFocus: false };


/**
 * Quick "library" and "wishlist" toggles of a game card. A game is either
 * owned (in the library), wished, or neither: each button moves it between
 * these states (adding a wished game to the library makes it owned, wishing
 * an owned game moves it to the wishlist). Only active inside a
 * LibraryStatusProvider with a signed-in user (`available`), which seeds the
 * statuses in one request instead of one per card.
 */
export function useQuickAddToLibrary(
  gameId: string,
  { onAdd, onAddFailed }: QuickAddCallbacks = {}
) {
  const t = useTranslations("games.quickAdd");
  const { isSeeding, signedIn } = useLibraryStatus();
  const seeding = isSeeding(gameId);
  const { trigger: toggle } = useLibraryToggle();
  const { trigger: changeStatus } = useLibraryStatusChange();
  const [pending, setPending] = useState<QuickAction | null>(null);

  const { data } = useSWR<LibraryStatusResponse>(
    signedIn && !seeding ? libraryStatusKey(gameId) : null,
    STATUS_OPTIONS
  );

  const wished = !!data?.inLibrary && data.status === "wishlist";
  const owned = !!data?.inLibrary && !wished;

  // `adds`: the action puts the game in `action`'s list (vs taking it out).
  const run = useCallback(
    async (action: QuickAction, adds: boolean, request: () => Promise<unknown>, errorKey: string) => {
      setPending(action);
      if (adds) onAdd?.(action);
      try {
        await request();
      } catch {
        toast({ title: t(errorKey), variant: "destructive" });
        if (adds) onAddFailed?.(action);
      } finally {
        setPending(null);
      }
    },
    [t, onAdd, onAddFailed]
  );

  const toggleLibrary = useCallback(() => {
    if (owned) {
      return run("library", false, () => toggle({ gameId, inLibrary: false }), "removeError");
    }
    if (wished) {
      return run("library", true, () => changeStatus({ gameId, status: "owned" }), "error");
    }
    return run("library", true, () => toggle({ gameId, inLibrary: true }), "error");
  }, [owned, wished, run, toggle, changeStatus, gameId]);

  const toggleWishlist = useCallback(() => {
    if (wished) {
      const remove = () => toggle({ gameId, inLibrary: false });
      return run("wishlist", false, remove, "wishlistRemoveError");
    }
    const add = owned
      ? () => changeStatus({ gameId, status: "wishlist" })
      : () => toggle({ gameId, inLibrary: true, status: "wishlist" });
    return run("wishlist", true, add, "wishlistError");
  }, [owned, wished, run, toggle, changeStatus, gameId]);

  return {
    available: signedIn,
    owned,
    wished,
    loading: seeding || (signedIn && data === undefined),
    pending,
    toggleLibrary,
    toggleWishlist,
  };
}
