import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GameDetailsContent } from "@/components/games/details/GameDetailsContent";
import { GameDetailsSkeleton } from "@/components/games/details/GameDetailsSkeleton";
import { GameService } from "@/lib/services/gameService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { SeoBreadcrumb } from "@/components/shared/SeoBreadcrumb";
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
  const tNav = await getTranslations({ locale, namespace: "navigation" });

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

    return (
      <>
        <JsonLd data={gameJsonLd} />
        <SeoBreadcrumb
          items={[
            { label: tNav("home"), href: "/" },
            { label: tNav("games"), href: "/games" },
            { label: game.title },
          ]}
        />
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
          <GameDetailsContent game={game} locale={locale} />
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

  // Fetch léger : juste les couleurs pour colorer le skeleton
  const colorHints = await GameService.fetchGameColors(slug);

  return (
    <DashboardLayout>
      <Suspense fallback={<GameDetailsSkeleton backgroundColor={colorHints?.backgroundColor} />}>
        <GameDetailsLoader slug={slug} locale={locale} />
      </Suspense>
    </DashboardLayout>
  );
}

export async function generateMetadata({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;
  return await GameService.generateGameMetadata(slug, locale);
}
