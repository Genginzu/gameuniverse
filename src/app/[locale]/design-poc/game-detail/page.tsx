/**
 * Page POC game-detail — refonte complète de la page détails d'un jeu.
 *
 * Toutes les informations de la page existante (`/games/[slug]`) sont
 * conservées mais réorganisées en layout éditorial style Imba.
 *
 * Modes :
 * - `?game=cyberpunk|valorant|magenta|cyan` → maquette mockée pour démo
 * - `?slug=god-of-war-ragnarok` → données réelles depuis la BDD
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { DynamicAccent } from "@/components/design-poc/DynamicAccent";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { GameService } from "@/lib/services/gameService";
import { POC_GAMES } from "./game-data";
import { adaptGameDetailsToPoc } from "./real-data-adapter";
import { DetailHero } from "./DetailHero";
import {
  AboutSection,
  StatsBento,
  AgeRatingsSection,
  LanguagesSection,
  PlaytimeSection,
} from "./DetailSections";
import { MediaGallery, VersionsSection, DlcSection, MusicSection } from "./DetailMedia";
import {
  PricingSection,
  PriceHistorySection,
  ReviewsSection,
  SimilarGamesSection,
} from "./DetailEcommerce";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ game?: string; slug?: string }>;
}

export default async function DesignPocGameDetailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  // Mode "vrai jeu" : on fetch les données réelles
  if (sp.slug) {
    const realGame = await loadRealGame(sp.slug, locale);
    if (!realGame) notFound();

    return (
      <DynamicAccent palette={realGame.palette}>
        <PocHeader locale={locale} pageLabel={`Real data · ${realGame.title}`} />
        <ModeSwitcher locale={locale} mode="real" currentSlug={sp.slug} />
        <PageBody game={realGame} />
        <PocFooter />
      </DynamicAccent>
    );
  }

  // Mode "mock" : maquette de démo avec switcher de couleur
  const gameKey = sp.game ?? "cyberpunk";
  const game = POC_GAMES[gameKey] ?? POC_GAMES.cyberpunk;

  return (
    <DynamicAccent palette={game.palette}>
      <PocHeader locale={locale} pageLabel="Game / Detail" />
      <ModeSwitcher locale={locale} mode="mock" currentGameKey={gameKey} />
      <PageBody game={game} />
      <PocFooter />
    </DynamicAccent>
  );
}

/* ============================================================================
 * Body — assemblage des sections (utilisé dans les deux modes)
 * ============================================================================ */

function PageBody({ game }: { game: ReturnType<typeof adaptGameDetailsToPoc> }) {
  return (
    <>
      <DetailHero game={game} />
      <AboutSection game={game} />
      <StatsBento game={game} />
      <MediaGallery game={game} />
      <PlaytimeSection game={game} />
      <PricingSection game={game} />
      <PriceHistorySection game={game} />
      <VersionsSection game={game} />
      <DlcSection game={game} />
      <LanguagesSection game={game} />
      <AgeRatingsSection game={game} />
      <MusicSection game={game} />
      <ReviewsSection game={game} />
      <SimilarGamesSection game={game} />
    </>
  );
}

/* ============================================================================
 * Mode switcher — bandeau au top pour passer entre démo et vraies données
 * ============================================================================ */

function ModeSwitcher({
  locale,
  mode,
  currentGameKey,
  currentSlug,
}: {
  locale: string;
  mode: "mock" | "real";
  currentGameKey?: string;
  currentSlug?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 pt-2 lg:px-12">
      <div className="flex flex-wrap items-center gap-2">
        <span className="poc-kicker mr-2">Demo</span>

        {/* Mocks */}
        {Object.entries(POC_GAMES).map(([key, g]) => (
          <Link
            key={key}
            href={`/${locale}/design-poc/game-detail?game=${key}`}
            className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
              mode === "mock" && currentGameKey === key
                ? "border-white/30 bg-white/5 text-white"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: g.palette.scale[400] }}
            />
            {g.title}
          </Link>
        ))}

        <span className="poc-kicker mx-2">·</span>
        <span className="poc-kicker">Real data</span>

        <Link
          href={`/${locale}/design-poc/game-detail?slug=god-of-war-ragnarok`}
          className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
            mode === "real" && currentSlug === "god-of-war-ragnarok"
              ? "border-white/30 bg-white/5 text-white"
              : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <span className="size-2 rounded-full bg-zinc-300" />
          God of War Ragnarök
        </Link>
      </div>
    </div>
  );
}

/* ============================================================================
 * Loader vraies données
 * ============================================================================ */

async function loadRealGame(slug: string, locale: string) {
  const game = await GameService.fetchGameDetails(slug, locale);
  if (!game) return null;

  // Fetch en parallèle des données complémentaires (best effort, on ignore les erreurs)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const [playerPlaytime, priceHistory] = await Promise.all([
    safeFetch<PlayerPlaytimeResponse>(
      `${baseUrl}/api/games/${slug}/playtime`,
      { next: { revalidate: 60 } }
    ),
    safeFetch<PriceHistoryResponse>(
      `${baseUrl}/api/games/${slug}/price-history`,
      { next: { revalidate: 300 } }
    ),
  ]);

  return adaptGameDetailsToPoc({
    game,
    playerPlaytime: playerPlaytime?.stats ?? null,
    priceHistory: priceHistory?.history ?? [],
    liveStats: { playersOnline: 0, activeStreams: 0, tournaments: 0 },
    reviews: [],
  });
}

interface PlayerPlaytimeResponse {
  stats?: import("@/types/game").PlayerPlaytimeStats;
}

interface PriceHistoryResponse {
  history?: Array<{ recorded_at: string; price: number }>;
}

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
