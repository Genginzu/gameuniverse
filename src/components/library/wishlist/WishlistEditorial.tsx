"use client";

/**
 * WishlistEditorial : `/library/wishlist` page. Games the player wants but has
 * not bought yet (library status `wishlist`), most recently wished first.
 * Each card offers "Bought" (moves the game into the library) and "Remove".
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { GameCard } from "@/components/games/GameCard";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { EditorialPageHeader } from "@/components/shared/EditorialPageHeader";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import type { LibraryGame } from "@/types/library";

import { WishlistCardActions } from "./WishlistCardActions";
import { WishlistAuthRequired, WishlistEmptyState } from "./WishlistStates";

const GRID =
  "grid grid-cols-1 gap-4 min-[475px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 min-[1536px]:grid-cols-6 min-[1536px]:gap-5";

export function WishlistEditorial({ locale }: { locale: string }) {
  const t = useTranslations("userLibrary.wishlist");
  const { user, loading: authLoading } = useAuth();
  const { games, loading } = useWishlist(locale, !!user);

  return (
    <section className="w-full">
      <EditorialContainer>
        <EditorialPageHeader
          kicker={t("kicker")}
          title={t("titlePrefix")}
          titleAccent={t("titleAccent")}
          subtitle={t("subtitle")}
        >
          <Link
            href="/library"
            className="border-editorial-line text-editorial-muted mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm hover:text-white"
          >
            <Icon icon="lucide:library" className="h-4 w-4" aria-hidden />
            {t("backToLibrary")}
          </Link>
        </EditorialPageHeader>

        {authLoading || (user && loading) ? (
          <GridSkeleton skeletonConfig={gameSkeletonConfig} count={10} />
        ) : !user ? (
          <WishlistAuthRequired />
        ) : games.length === 0 ? (
          <WishlistEmptyState />
        ) : (
          <WishlistGrid games={games} count={t("count", { count: games.length })} />
        )}
      </EditorialContainer>
    </section>
  );
}

function WishlistGrid({ games, count }: { games: LibraryGame[]; count: string }) {
  return (
    <>
      <p className="text-editorial-muted mb-4 text-sm sm:text-base" aria-live="polite">
        {count}
      </p>
      <LibraryStatusProvider gameIds={games.map((game) => game.id)}>
        <div className={GRID} data-testid="editorial-wishlist-grid">
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              priority={index < 5}
              actions={<WishlistCardActions gameId={game.id} title={game.title} />}
            />
          ))}
        </div>
      </LibraryStatusProvider>
    </>
  );
}
