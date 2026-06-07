import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PlayerDetailsContent } from "@/components/players/PlayerDetailsContent";
import { PlayerService } from "@/lib/services/playerService";
import { EditorialShell } from "@/components/layout/editorial/EditorialShell";
import { DynamicAccent } from "@/components/shared/DynamicAccent";
import { paletteFromHex } from "@/lib/utils/accent-palette";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { createServerClient } from "@/lib/supabase-server";

interface PlayerDetailsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function PlayerDetailsPage({ params }: PlayerDetailsPageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "players.errors" });

  // Validate player ID format - Requirements 5.3
  if (!PlayerService.validatePlayerId(id)) {
    notFound();
  }

  try {
    const supabase = await createServerClient();
    const [{ data: playerData }, player] = await Promise.all([
      supabase.auth.getUser(),
      PlayerService.fetchPlayerDetailsFromDB(id, locale),
    ]);

    // Handle 404 if player not found - Requirements 5.3
    if (!player) {
      notFound();
    }

    return (
      <EditorialShell>
        {/* Accent bleu du site (palette-primary-500) plutôt que gold */}
        <DynamicAccent palette={paletteFromHex("#0077e6", "blue")} as="div">
          <ErrorBoundary
            fallback={
              <ErrorFallback
                title={t("loadingTitle")}
                description={t("detailsLoadingDescription")}
                showBackButton={true}
                backUrl={`/${locale}/players`}
                backLabel={t("backToPlayers")}
                locale={locale}
              />
            }
          >
            <PlayerDetailsContent
              player={player}
              locale={locale}
              currentUserId={playerData.user?.id ?? null}
            />
          </ErrorBoundary>
        </DynamicAccent>
      </EditorialShell>
    );
  } catch {
    return (
      <EditorialShell>
        <ErrorFallback
          title={t("loadingTitle")}
          description={t("unableToLoad")}
          showBackButton={true}
          backUrl={`/${locale}/players`}
          backLabel={t("backToPlayers")}
          locale={locale}
        />
      </EditorialShell>
    );
  }
}

// Generate metadata for SEO - Requirements 5.4
export async function generateMetadata({ params }: PlayerDetailsPageProps) {
  const { locale, id } = await params;

  return await PlayerService.generatePlayerMetadata(id, locale);
}
