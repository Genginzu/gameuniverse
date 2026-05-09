/**
 * Page POC game-detail — refonte complète de la page détails d'un jeu.
 *
 * Modes :
 * - `?game=cyberpunk|valorant|magenta|cyan` → maquette mockée pour démo
 * - `?slug=god-of-war-ragnarok` → données réelles depuis la BDD
 * - `?layout=immersive|sidebar|collapsible` → 3 variantes de chrome (sidebar)
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { DynamicAccent } from "@/components/design-poc/DynamicAccent";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { PocSidebar } from "@/components/design-poc/PocSidebar";
import { HybridShell } from "@/components/design-poc/HybridShell";
import { DiscordShell } from "@/components/design-poc/DiscordShell";
import { SpotifyShell } from "@/components/design-poc/SpotifyShell";
import { GameService } from "@/lib/services/gameService";
import { POC_GAMES, type PocGameData } from "./game-data";
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

type LayoutVariant = "immersive" | "sidebar" | "collapsible" | "hybrid" | "discord" | "spotify";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ game?: string; slug?: string; layout?: string }>;
}

export default async function DesignPocGameDetailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  // Déterminer la variante de layout (défaut : immersive)
  const requested = sp.layout;
  const validLayouts: LayoutVariant[] = [
    "immersive",
    "sidebar",
    "collapsible",
    "hybrid",
    "discord",
    "spotify",
  ];
  const layout: LayoutVariant =
    requested && (validLayouts as string[]).includes(requested)
      ? (requested as LayoutVariant)
      : "immersive";

  // Charger le jeu (mocké ou réel)
  let game: PocGameData;
  let pageLabel: string;

  if (sp.slug) {
    const realGame = await loadRealGame(sp.slug, locale);
    if (!realGame) notFound();
    game = realGame;
    pageLabel = `Real data · ${realGame.title}`;
  } else {
    const gameKey = sp.game ?? "cyberpunk";
    game = POC_GAMES[gameKey] ?? POC_GAMES.cyberpunk;
    pageLabel = "Game / Detail";
  }

  const switchers = (
    <ModeSwitchers
      locale={locale}
      currentSlug={sp.slug}
      currentGameKey={sp.game}
      currentLayout={layout}
    />
  );

  const pageBody = <PageBody game={game} />;

  return (
    <DynamicAccent palette={game.palette}>
      {layout === "immersive" && (
        <ImmersiveLayout locale={locale} pageLabel={pageLabel} switchers={switchers}>
          {pageBody}
        </ImmersiveLayout>
      )}
      {layout === "sidebar" && (
        <SidebarLayout locale={locale} pageLabel={pageLabel} switchers={switchers}>
          {pageBody}
        </SidebarLayout>
      )}
      {layout === "collapsible" && (
        <CollapsibleLayout locale={locale} pageLabel={pageLabel} switchers={switchers}>
          {pageBody}
        </CollapsibleLayout>
      )}
      {layout === "hybrid" && (
        <HybridLayout locale={locale} switchers={switchers}>
          {pageBody}
        </HybridLayout>
      )}
      {layout === "discord" && (
        <DiscordLayout locale={locale} switchers={switchers}>
          {pageBody}
        </DiscordLayout>
      )}
      {layout === "spotify" && (
        <SpotifyLayout locale={locale} switchers={switchers}>
          {pageBody}
        </SpotifyLayout>
      )}
    </DynamicAccent>
  );
}

/* ============================================================================
 * Variante A — Immersive : pas de sidebar, top header transparent
 * ============================================================================ */

function ImmersiveLayout({
  locale,
  pageLabel,
  switchers,
  children,
}: {
  locale: string;
  pageLabel: string;
  switchers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <PocHeader locale={locale} pageLabel={pageLabel} />
      {switchers}
      {children}
      <PocFooter />
    </>
  );
}

/* ============================================================================
 * Variante B — Sidebar permanente 240px à gauche + topbar minimal
 * ============================================================================ */

function SidebarLayout({
  locale,
  pageLabel,
  switchers,
  children,
}: {
  locale: string;
  pageLabel: string;
  switchers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <PocSidebar locale={locale} />
      <div className="min-w-0 flex-1">
        {/* Topbar plus compact dans cette variante */}
        <CompactTopbar locale={locale} pageLabel={pageLabel} />
        {switchers}
        {children}
        <PocFooter />
      </div>
    </div>
  );
}

/* ============================================================================
 * Variante C — Sidebar collapsible 64px → 240px au hover
 * ============================================================================ */

function CollapsibleLayout({
  locale,
  pageLabel,
  switchers,
  children,
}: {
  locale: string;
  pageLabel: string;
  switchers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <PocSidebar locale={locale} collapsed expandOnHover />
      <div className="min-w-0 flex-1">
        <CompactTopbar locale={locale} pageLabel={pageLabel} />
        {switchers}
        {children}
        <PocFooter />
      </div>
    </div>
  );
}

/* ============================================================================
 * Variante D — Hybrid : top mega-menu + Cmd+K command palette
 * ============================================================================ */

function HybridLayout({
  locale,
  switchers,
  children,
}: {
  locale: string;
  switchers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <HybridShell locale={locale}>
      {switchers}
      {children}
      <PocFooter />
    </HybridShell>
  );
}

/* ============================================================================
 * Variante E — Discord-like : double sidebar (rail + sub-side)
 * ============================================================================ */

function DiscordLayout({
  locale,
  switchers,
  children,
}: {
  locale: string;
  switchers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DiscordShell locale={locale} defaultSpace="games">
      {switchers}
      {children}
      <PocFooter />
    </DiscordShell>
  );
}

/* ============================================================================
 * Variante F — Spotify-like : search-first
 * ============================================================================ */

function SpotifyLayout({
  locale,
  switchers,
  children,
}: {
  locale: string;
  switchers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SpotifyShell locale={locale}>
      {switchers}
      {children}
      <PocFooter />
    </SpotifyShell>
  );
}

/* ============================================================================
 * Topbar compact pour les variantes sidebar
 * ============================================================================ */

function CompactTopbar({ locale, pageLabel }: { locale: string; pageLabel: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#120821]/80 px-6 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-6">
        <Link
          href={`/${locale}/design-poc`}
          className="poc-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          ← Index POC
        </Link>
        <span className="poc-kicker hidden md:inline">{pageLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          aria-label="Search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="m20 20-3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

/* ============================================================================
 * Body — assemblage des sections (utilisé dans les trois layouts)
 * ============================================================================ */

function PageBody({ game }: { game: PocGameData }) {
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
 * Switchers — bandeau au top pour basculer entre démo/data et entre layouts
 * ============================================================================ */

function ModeSwitchers({
  locale,
  currentSlug,
  currentGameKey,
  currentLayout,
}: {
  locale: string;
  currentSlug?: string;
  currentGameKey?: string;
  currentLayout: LayoutVariant;
}) {
  const buildLayoutHref = (layout: LayoutVariant) => {
    const params = new URLSearchParams();
    if (currentSlug) params.set("slug", currentSlug);
    else if (currentGameKey) params.set("game", currentGameKey);
    if (layout !== "immersive") params.set("layout", layout);
    const qs = params.toString();
    return `/${locale}/design-poc/game-detail${qs ? `?${qs}` : ""}`;
  };

  const buildDataHref = (key: { slug?: string; game?: string }) => {
    const params = new URLSearchParams();
    if (key.slug) params.set("slug", key.slug);
    if (key.game) params.set("game", key.game);
    if (currentLayout !== "immersive") params.set("layout", currentLayout);
    return `/${locale}/design-poc/game-detail?${params.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-2 px-6 pt-3 lg:px-12">
      {/* Layout switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="poc-kicker mr-2">Layout</span>
        {(
          [
            { key: "immersive", label: "A — Immersive" },
            { key: "sidebar", label: "B — Sidebar fixe" },
            { key: "collapsible", label: "C — Sidebar collapsible" },
            { key: "hybrid", label: "D — Hybrid (mega + ⌘K)" },
            { key: "discord", label: "E — Discord-like" },
            { key: "spotify", label: "F — Spotify-like" },
          ] as const
        ).map((l) => (
          <Link
            key={l.key}
            href={buildLayoutHref(l.key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              currentLayout === l.key
                ? "border-[var(--poc-accent-400)] bg-[var(--poc-accent-500)]/15 text-white"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Data switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="poc-kicker mr-2">Demo</span>
        {Object.entries(POC_GAMES).map(([key, g]) => (
          <Link
            key={key}
            href={buildDataHref({ game: key })}
            className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
              currentGameKey === key
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
          href={buildDataHref({ slug: "god-of-war-ragnarok" })}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
            currentSlug === "god-of-war-ragnarok"
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const [playerPlaytime, priceHistory] = await Promise.all([
    safeFetch<PlayerPlaytimeResponse>(`${baseUrl}/api/games/${slug}/playtime`, {
      next: { revalidate: 60 },
    }),
    safeFetch<PriceHistoryResponse>(`${baseUrl}/api/games/${slug}/price-history`, {
      next: { revalidate: 300 },
    }),
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
