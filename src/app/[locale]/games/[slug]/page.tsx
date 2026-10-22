export const revalidate = 60;

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GameDetailsContent } from "@/components/games/details/GameDetailsContent";
import { GameDetailsSkeleton } from "@/components/games/details/GameDetailsSkeleton";
import { GameService } from "@/lib/services/gameService";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { DynamicAccent } from "@/components/shared/DynamicAccent";
import { paletteFromHex } from "@/lib/utils/accent-palette";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { JsonLd } from "@/components/shared/JsonLd";
import { getTranslations } from "next-intl/server";

interface GameDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/** Composant async qui fetch les données complètes du jeu */
async function GameDetailsLoader({ slug, locale }: { slug: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "gameDetails.errors" });

  try {
    const game = await GameService.fetchGameDetails(slug, locale);

    if (!game) {
      notFound();
    }

    const gameJsonLd = {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: game.title,
      description: game.description,
      image: game.media.coverImage,
      genre: game.genres?.map((g: { name: string }) => g.name),
      gamePlatform: game.platforms?.map((p: { name: string }) => p.name),
      ...(game.metascore && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: game.metascore,
          bestRating: 100,
          worstRating: 0,
        },
      }),
      ...(game.releaseDate && { datePublished: game.releaseDate }),
    };

    // Génère la palette d'accent dynamique depuis la couleur extraite de la cover
    const palette = paletteFromHex(game.accentColor ?? null, game.slug);

    return (
      <>
        <JsonLd data={gameJsonLd} />
        <ErrorBoundary
          fallback={
            <ErrorFallback
              title={t("loadingTitle")}
              description={t("loadingDescription")}
              showBackButton={true}
              backUrl={`/${locale}/games`}
              backLabel={t("backToGames")}
              locale={locale}
            />
          }
        >
          <DynamicAccent palette={palette} as="div">
            <GameDetailsContent game={game} locale={locale} />
          </DynamicAccent>
        </ErrorBoundary>
      </>
    );
  } catch {
    return (
      <ErrorFallback
        title={t("loadingTitle")}
        description={t("unableToLoad")}
        showBackButton={true}
        backUrl={`/${locale}/games`}
        backLabel={t("backToGames")}
        locale={locale}
      />
    );
  }
}

export default async function GameDetailsPage({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;

  return (
    <EditorialShell>
      <Suspense fallback={<GameDetailsSkeleton />}>
        <GameDetailsLoader slug={slug} locale={locale} />
      </Suspense>
    </EditorialShell>
  );
}

export async function generateMetadata({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;
  return await GameService.generateGameMetadata(slug, locale);
}

// Return empty array: pages are generated on-demand with ISR (revalidate: 60s)
export async function generateStaticParams() {
  return [];
}
