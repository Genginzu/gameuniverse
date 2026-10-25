"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";

import { useLibraryToggle } from "./useLibraryToggle";
import { toast } from "./use-toast";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { libraryStatusKey } from "@/lib/swr/keys";
import type { LibraryStatusResponse } from "@/types/library";

// Seeded in batch by LibraryStatusProvider and revalidated after each toggle.
const STATUS_OPTIONS = { revalidateIfStale: false, revalidateOnFocus: false };

/**
 * Quick "add to library" of a game card. Only active inside a
 * LibraryStatusProvider with a signed-in user (`available`), which seeds the
 * statuses in one request instead of one per card.
 */
export function useQuickAddToLibrary(gameId: string) {
  const t = useTranslations("games.quickAdd");
  const { isSeeding, signedIn } = useLibraryStatus();
  const seeding = isSeeding(gameId);
  const { trigger, isPending } = useLibraryToggle();

  const { data } = useSWR<LibraryStatusResponse>(
    signedIn && !seeding ? libraryStatusKey(gameId) : null,
    STATUS_OPTIONS
  );

  const add = useCallback(async () => {
    try {
      await trigger({ gameId, inLibrary: true });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  }, [trigger, gameId, t]);

  return {
    available: signedIn,
    inLibrary: data?.inLibrary ?? false,
    loading: seeding || (signedIn && data === undefined),
    isPending,
    add,
  };
}
