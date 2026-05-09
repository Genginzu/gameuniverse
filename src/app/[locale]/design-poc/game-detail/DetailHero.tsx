/**
 * Hero immersif de la page game-detail.
 *
 * Background plein écran + scanlines + cover sticky à gauche, identité du jeu
 * à droite. CTAs library/share/share. Ticker live en bas.
 */

import Image from "next/image";
import type { PocGameData } from "./game-data";

interface DetailHeroProps {
  game: PocGameData;
}

export function DetailHero({ game }: DetailHeroProps) {
  const releaseYear = new Date(game.releaseDate).getFullYear();
  const cheapest =
    game.pricing.length > 0
      ? game.pricing.reduce((min, p) => (p.price < min.price ? p : min), game.pricing[0])
      : null;

  return (
    <section className="relative overflow-hidden">
      {/* Background full-bleed */}
      <div className="absolute inset-0">
        <Image
          src={game.hero}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="poc-scanlines" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#120821]/40 via-[#120821]/70 to-[#120821]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120821] via-[#120821]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-16 pt-32 lg:px-12 lg:pb-24 lg:pt-44">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Cover sticky */}
          <div className="lg:col-span-3">
            <div className="relative mx-auto aspect-[3/4] max-w-[280px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 lg:mx-0">
              <Image
                src={game.cover}
                alt={game.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 280px, 80vw"
                priority
              />
              {/* Glow néon accent */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  boxShadow:
                    "inset 0 0 40px rgba(var(--poc-accent-glow), 0.15), 0 0 80px rgba(var(--poc-accent-glow), 0.2)",
                }}
              />
            </div>
          </div>

          {/* Identité */}
          <div className="lg:col-span-9 flex flex-col justify-center">
            <p className="poc-kicker mb-6">
              {game.developers[0]} · {releaseYear} · {game.platforms.length} platforms
            </p>

            <h1 className="poc-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.92] text-white">
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

            <p className="poc-display-light mt-6 max-w-3xl text-2xl leading-snug text-zinc-200 sm:text-3xl">
              {game.tagline}
            </p>

            {/* Genres pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {game.genres.map((g) => (
                <span
                  key={g.id}
                  className="poc-mono rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-wider text-zinc-300"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* CTAs + stats */}
            <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button className="poc-pill poc-pill-primary">
                  <Heart />
                  Add to library
                </button>
                <button className="poc-pill poc-pill-ghost">
                  <Share />
                  Share
                </button>
              </div>

              <div className="flex items-center gap-8 lg:gap-12">
                <HeroStat label="Score" value={String(game.metascore)} suffix="/100" accent />
                <HeroStat
                  label="From"
                  value={cheapest ? formatPrice(cheapest.price, cheapest.currency) : "—"}
                />
                <HeroStat
                  label="Players"
                  value={formatNumber(game.liveStats.playersOnline)}
                  liveDot
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live ticker */}
      <div className="relative z-10 border-y border-white/5 bg-[var(--poc-accent-500)]/10">
        <div className="mx-auto max-w-[1600px] overflow-hidden px-6 py-3 lg:px-12">
          <p className="poc-mono text-xs uppercase tracking-widest text-zinc-300">
            <span className="mr-3 inline-block size-2 animate-pulse rounded-full bg-[var(--poc-accent-400)] align-middle" />
            Live · {formatNumber(game.liveStats.playersOnline)} playing now ·{" "}
            {game.liveStats.activeStreams} streams · {game.liveStats.tournaments} tournaments
            this week
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  suffix,
  accent,
  liveDot,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
  liveDot?: boolean;
}) {
  return (
    <div>
      <p
        className={`poc-display text-3xl ${
          accent ? "text-[var(--poc-accent-400)]" : "text-white"
        }`}
      >
        {liveDot && (
          <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-[var(--poc-accent-400)] align-middle" />
        )}
        {value}
        {suffix && <span className="text-zinc-500">{suffix}</span>}
      </p>
      <p className="poc-kicker mt-1">{label}</p>
    </div>
  );
}

function Heart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9Z" />
    </svg>
  );
}

function Share() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4m0 0L8 6m4-4v13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(price);
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
