"use client";

/**
 * WishlistCardActions : controls layered over a GameCard of `/library/wishlist`.
 * "Bought" moves the game into the library (status owned), the other button
 * removes it from the wishlist. Statuses are batch-seeded by the surrounding
 * LibraryStatusProvider.
 */

import { useTranslations } from "next-intl";

import { CardActionButton } from "@/components/games/CardActionButton";
import { useLibraryStatus } from "@/components/providers/LibraryStatusProvider";
import { useLibraryEntry } from "@/hooks/useLibraryEntry";
import { toast } from "@/hooks/use-toast";

interface WishlistCardActionsProps {
  gameId: string;
  title: string;
}

export function WishlistCardActions({ gameId, title }: WishlistCardActionsProps) {
  const t = useTranslations("userLibrary.wishlist");
  const { signedIn } = useLibraryStatus();
  const { adding, setStatus, removeFromLibrary } = useLibraryEntry(gameId, signedIn);

  const run = async (action: () => Promise<boolean>, success: string) => {
    if (await action()) toast({ title: success });
    else toast({ title: t("error"), variant: "destructive" });
  };

  return (
    <div className="absolute top-2 left-2 z-[5] flex flex-col gap-2">
      <CardActionButton
        icon="lucide:shopping-bag"
        label={t("markOwnedLabel", { title })}
        disabled={adding}
        onClick={() => run(() => setStatus("owned"), t("markedOwned", { title }))}
      />
      <CardActionButton
        icon="lucide:x"
        label={t("removeLabel", { title })}
        disabled={adding}
        onClick={() => run(removeFromLibrary, t("removed", { title }))}
      />
    </div>
  );
}
