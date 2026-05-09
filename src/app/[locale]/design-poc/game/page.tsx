/**
 * Page POC game — fiche jeu façon magazine.
 *
 * Démontre le système d'accent dynamique : la couleur change via le query
 * param ?accent=cyberpunk|valorant|magenta|cyan.
 */

import Image from "next/image";
import Link from "next/link";
import {
  DynamicAccent,
  CYBERPUNK_PALETTE,
  VALORANT_PALETTE,
  MAGENTA_PALETTE,
  CYAN_PALETTE,
  type AccentPalette,
} from "@/components/design-poc/DynamicAccent";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ accent?: string }>;
}

const PALETTES: Record<string, AccentPalette> = {
  cyberpunk: CYBERPUNK_PALETTE,
  valorant: VALORANT_PALETTE,
  magenta: MAGENTA_PALETTE,
  cyan: CYAN_PALETTE,
};

const GAME_DATA: Record<keyof typeof PALETTES, {
  title: string;
  studio: string;
  year: string;
  rating: number;
  cover: string;
  hero: string;
  tagline: string;
}> = {
  cyberpunk: {
    title: "Cyberpunk 2077",
    studio: "CD Projekt Red",
    year: "2020",
    rating: 8.7,
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
    hero: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80",
    tagline: "Welcome to Night City — where every choice writes your legend.",
  },
  valorant: {
    title: "Valorant",
    studio: "Riot Games",
    year: "2020",
    rating: 8.2,
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0g.webp",
    hero: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&q=80",
    tagline: "Defy the limits. Compete on the world's biggest tactical FPS stage.",
  },
  magenta: {
    title: "Stellar Quest",
    studio: "Indie Studios",
    year: "2025",
    rating: 9.1,
    cover: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80",
    hero: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1920&q=80",
    tagline: "An odyssey through the stars, hand-drawn frame by frame.",
  },
  cyan: {
    title: "Aqua Drift",
    studio: "Wave Interactive",
    year: "2025",
    rating: 8.5,
    cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80",
    hero: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&q=80",
    tagline: "Race the seven seas in the most stunning racer of the year.",
  },
};

export default async function DesignPocGamePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const accentKey = (sp.accent ?? "cyberpunk") as keyof typeof PALETTES;
  const palette = PALETTES[accentKey] ?? CYBERPUNK_PALETTE;
  const game = GAME_DATA[accentKey] ?? GAME_DATA.cyberpunk;

  return (
    <DynamicAccent palette={palette}>
      <PocHeader locale={locale} pageLabel="Game / Showcase" />

      {/* HERO PLEIN ECRAN ================================================== */}
      <section className="relative min-h-[760px] overflow-hidden">
        <Image
          src={game.hero}
          alt={game.title}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="poc-scanlines" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#120821]/30 via-[#120821]/60 to-[#120821]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120821] via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col px-6 pb-20 pt-32 lg:px-12 lg:pb-28 lg:pt-44">
          <p className="poc-kicker poc-reveal mb-6">
            {game.studio} · {game.year}
          </p>

          <h1 className="poc-display poc-reveal max-w-4xl text-[clamp(3rem,9vw,8rem)] leading-[0.92] text-white">
            {game.title.split(" ").map((word: string, i: number, arr: string[]) => (
              <span key={i}>
                {i === arr.length - 1 ? (
                  <span className="bg-gradient-to-r from-[var(--poc-accent-300)] to-[var(--poc-accent-500)] bg-clip-text text-transparent">
                    {word}
                  </span>
                ) : (
                  word
                )}
                {i < arr.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="poc-display-light mt-6 max-w-2xl text-2xl text-zinc-300 sm:text-3xl">
            {game.tagline}
          </p>

          <div className="mt-auto flex flex-col gap-8 pt-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button className="poc-pill poc-pill-primary">
                Add to library
                <Plus />
              </button>
              <button className="poc-pill poc-pill-ghost">View tournaments</button>
            </div>

            <div className="flex items-center gap-8 lg:gap-12">
              <Stat label="Score" value={String(game.rating)} suffix="/10" />
              <Stat label="Players" value="487k" />
              <Stat label="Reviews" value="3 240" />
            </div>
          </div>
        </div>
      </section>

      {/* TICKER BAR ========================================================= */}
      <div className="border-y border-white/5 bg-[var(--poc-accent-500)]/10">
        <div className="mx-auto max-w-[1600px] overflow-hidden px-6 py-3 lg:px-12">
          <p className="poc-mono text-xs uppercase tracking-widest text-zinc-300">
            <span className="mr-3 inline-block size-2 rounded-full bg-[var(--poc-accent-400)] align-middle animate-pulse" />
            Live · 487k playing now · 14 tournaments this week · 89 streams active
          </p>
        </div>
      </div>

      {/* SWITCHER ACCENT (démo) ============================================= */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pt-12 lg:px-12">
        <p className="poc-kicker mb-4">Demo — try another accent</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PALETTES).map(([key, p]) => (
            <Link
              key={key}
              href={`/${locale}/design-poc/game?accent=${key}`}
              className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                accentKey === key
                  ? "border-white/30 bg-white/5 text-white"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className="size-3 rounded-full"
                style={{ background: p.scale[400] }}
              />
              {p.name}
            </Link>
          ))}
        </div>
      </section>

      {/* BENTO STATS ======================================================== */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SpotlightCard className="col-span-2 row-span-2 p-8 lg:p-10">
            <p className="poc-kicker mb-3">Community rating</p>
            <p className="poc-display text-7xl text-white lg:text-9xl">
              {game.rating}
              <span className="text-[var(--poc-accent-400)]">.</span>
              <span className="poc-display-light text-zinc-500">/10</span>
            </p>
            <p className="mt-4 max-w-md text-zinc-400">
              Basé sur 3 240 reviews communautaires et 47 tests de la rédaction.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-6">
            <p className="poc-kicker mb-3">Avg playtime</p>
            <p className="poc-display text-4xl text-white">62h</p>
          </SpotlightCard>

          <SpotlightCard className="p-6">
            <p className="poc-kicker mb-3">Achievements</p>
            <p className="poc-display text-4xl text-white">128</p>
          </SpotlightCard>

          <SpotlightCard className="p-6">
            <p className="poc-kicker mb-3">In libraries</p>
            <p className="poc-display text-4xl text-[var(--poc-accent-400)]">12 487</p>
          </SpotlightCard>

          <SpotlightCard className="p-6">
            <p className="poc-kicker mb-3">Active streams</p>
            <p className="poc-display text-4xl text-white">89</p>
          </SpotlightCard>
        </div>
      </section>

      {/* DESCRIPTION MAGAZINE =============================================== */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-3">
            <p className="poc-kicker">About</p>
            <p className="poc-display mt-4 text-3xl text-white">The story</p>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-zinc-300 lg:col-span-9 lg:columns-2 lg:gap-12">
            <p className="text-2xl text-white">
              {game.tagline} L&apos;histoire débute dans une mégalopole sans loi, où chaque ruelle
              cache un secret et chaque mission redéfinit ton destin.
            </p>
            <p>
              Un système de combat hybride mêlant tir, mêlée et capacités spéciales. Plus de 100
              heures de contenu narratif, des dizaines de fins possibles, et un open world dense
              comme jamais.
            </p>
            <p>
              La bande-son originale, signée par les meilleurs compositeurs du genre, accompagne
              chaque moment fort. Préparez-vous à une expérience qui mêle action, exploration et
              choix moraux.
            </p>
          </div>
        </div>
      </section>

      <PocFooter />
    </DynamicAccent>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div>
      <p className="poc-display text-3xl text-white">
        {value}
        {suffix && <span className="text-zinc-500">{suffix}</span>}
      </p>
      <p className="poc-kicker mt-1">{label}</p>
    </div>
  );
}

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
