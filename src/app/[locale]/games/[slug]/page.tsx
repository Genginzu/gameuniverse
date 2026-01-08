import { notFound } from "next/navigation";
import { GameDetailsContent } from "@/components/games/GameDetailsContent";
import { GameService } from "@/lib/services/gameService";
import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

interface GameDetailsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function GameDetailsPage({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;

  try {
    const game = await GameService.fetchGameDetails(slug, locale);

    if (!game) {
      notFound();
    }

    return (
      <DashboardLayout>
        <GameDetailsContent game={game} locale={locale} />
      </DashboardLayout>
    );
  } catch (error) {
    console.error("Error in GameDetailsPage:", error);
    // Return error state
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            {locale === "fr" ? "Erreur de chargement" : "Loading Error"}
          </h1>
          <p className="text-gray-600">
            {locale === "fr"
              ? "Impossible de charger les détails du jeu."
              : "Unable to load game details."}
          </p>
        </div>
      </div>
    );
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: GameDetailsPageProps) {
  const { locale, slug } = await params;

  return await GameService.generateGameMetadata(slug, locale);
}
