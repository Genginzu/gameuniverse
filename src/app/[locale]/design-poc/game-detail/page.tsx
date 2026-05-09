/**
 * Page POC game-detail — refonte complète de la page détails d'un jeu.
 *
 * Toutes les informations de la page existante (`/games/[slug]`) sont
 * conservées mais réorganisées en layout éditorial style Imba.
 *
 * Switcher de jeu (= théming dynamique) via ?game=cyberpunk|valorant|magenta|cyan.
 */

import Link from "next/link";
import { DynamicAccent } from "@/components/design-poc/DynamicAccent";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { POC_GAMES } from "./game-data";
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
  searchParams: Promise<{ game?: string }>;
}

export default async function DesignPocGameDetailPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const gameKey = sp.game ?? "cyberpunk";
  const game = POC_GAMES[gameKey] ?? POC_GAMES.cyberpunk;

  return (
    <DynamicAccent palette={game.palette}>
      <PocHeader locale={locale} pageLabel="Game / Detail" />

      {/* Game switcher (démo théming) */}
      <div className="mx-auto w-full max-w-[1600px] px-6 pt-2 lg:px-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className="poc-kicker mr-2">Demo · switch game</span>
          {Object.entries(POC_GAMES).map(([key, g]) => (
            <Link
              key={key}
              href={`/${locale}/design-poc/game-detail?game=${key}`}
              className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                gameKey === key
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
        </div>
      </div>

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

      <PocFooter />
    </DynamicAccent>
  );
}
