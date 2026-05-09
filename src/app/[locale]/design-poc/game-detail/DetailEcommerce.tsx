/**
 * Sections finales : Pricing (multi-store), Price history (mini chart),
 * Reviews (éditorial), Similar games.
 */

import Image from "next/image";
import Link from "next/link";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";
import type { PocGameData } from "./game-data";

/* ============================================================================
 * Pricing — comparaison multi-store
 * ============================================================================ */

export function PricingSection({ game }: { game: PocGameData }) {
  if (game.pricing.length === 0) return null;
  const sortedPricing = [...game.pricing].sort((a, b) => a.price - b.price);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <p className="poc-kicker mb-6">10 — Where to buy</p>
      <h2 className="poc-display mb-10 text-4xl text-white sm:text-5xl">
        Best <span className="text-[var(--poc-accent-400)]">deals</span> right now
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {sortedPricing.map((p, i) => (
          <SpotlightCard key={`${p.store}-${p.platform}`} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="poc-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  {p.platform}
                </p>
                <p className="poc-display mt-1 text-xl text-white">{p.store}</p>
              </div>
              {i === 0 && (
                <span
                  className="poc-mono rounded-full px-2 py-1 text-[10px] uppercase tracking-widest text-white"
                  style={{ background: "var(--poc-accent-500)" }}
                >
                  Best
                </span>
              )}
            </div>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="poc-display text-3xl text-[var(--poc-accent-400)]">
                {formatPrice(p.price, p.currency)}
              </span>
              {p.discount && (
                <span className="poc-mono text-sm text-zinc-400 line-through decoration-zinc-500">
                  {formatPrice(p.price / (1 - p.discount / 100), p.currency)}
                </span>
              )}
            </div>
            {p.discount && (
              <p className="poc-mono mt-1 text-xs text-[var(--poc-accent-300)]">
                −{p.discount}% off
              </p>
            )}
            <Link
              href={p.url}
              className="poc-pill poc-pill-ghost mt-5 w-full justify-center"
            >
              Visit {p.store}
              <Arrow />
            </Link>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}

/* ============================================================================
 * Price history — mini chart SVG
 * ============================================================================ */

export function PriceHistorySection({ game }: { game: PocGameData }) {
  if (game.priceHistory.length === 0) return null;

  const points = game.priceHistory;
  const max = Math.max(...points.map((p) => p.price));
  const min = Math.min(...points.map((p) => p.price));
  const W = 1200;
  const H = 240;
  const PADDING_X = 16;
  const PADDING_Y = 24;

  const xFor = (i: number) =>
    PADDING_X + (i / (points.length - 1)) * (W - PADDING_X * 2);
  const yFor = (price: number) => {
    if (max === min) return H / 2;
    return PADDING_Y + (1 - (price - min) / (max - min)) * (H - PADDING_Y * 2);
  };

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.price)}`).join(" ");
  const fillPath = `${path} L ${xFor(points.length - 1)} ${H} L ${xFor(0)} ${H} Z`;

  const current = points[points.length - 1].price;
  const oldest = points[0].price;
  const change = current - oldest;
  const changePct = (change / oldest) * 100;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <SpotlightCard className="p-6 lg:p-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="poc-kicker mb-2">11 — Price history</p>
            <h3 className="poc-display text-3xl text-white">Last 90 days</h3>
          </div>
          <div className="text-right">
            <p className="poc-display text-2xl text-[var(--poc-accent-400)]">
              {formatPrice(min, game.pricing[0]?.currency ?? "EUR")}
            </p>
            <p className="poc-kicker mt-1">All-time low</p>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full lg:h-60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--poc-accent-glow))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(var(--poc-accent-glow))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Aire */}
            <path d={fillPath} fill="url(#priceFill)" />
            {/* Ligne */}
            <path
              d={path}
              fill="none"
              stroke="rgb(var(--poc-accent-glow))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dernier point */}
            <circle
              cx={xFor(points.length - 1)}
              cy={yFor(current)}
              r="6"
              fill="rgb(var(--poc-accent-glow))"
            />
          </svg>
        </div>

        <div className="mt-6 flex flex-wrap gap-8">
          <div>
            <p className="poc-kicker">Current</p>
            <p className="poc-display text-2xl text-white">
              {formatPrice(current, game.pricing[0]?.currency ?? "EUR")}
            </p>
          </div>
          <div>
            <p className="poc-kicker">90d change</p>
            <p
              className={`poc-display text-2xl ${
                change <= 0 ? "text-[var(--poc-accent-400)]" : "text-zinc-300"
              }`}
            >
              {change <= 0 ? "" : "+"}
              {changePct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="poc-kicker">Highest</p>
            <p className="poc-display text-2xl text-white">
              {formatPrice(max, game.pricing[0]?.currency ?? "EUR")}
            </p>
          </div>
        </div>
      </SpotlightCard>
    </section>
  );
}

/* ============================================================================
 * Reviews — éditorial avec gros guillemets
 * ============================================================================ */

export function ReviewsSection({ game }: { game: PocGameData }) {
  if (game.reviews.length === 0) return null;
  const featured = game.reviews[0];
  const others = game.reviews.slice(1);

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="poc-kicker mb-3">12 — Community voice</p>
          <h2 className="poc-display text-4xl text-white sm:text-5xl">
            What players <span className="text-[var(--poc-accent-400)]">say</span>
          </h2>
        </div>
        <p className="poc-mono text-sm text-zinc-400">
          {game.reviews.length} reviews · avg{" "}
          {(game.reviews.reduce((s, r) => s + r.rating, 0) / game.reviews.length).toFixed(1)}
          /10
        </p>
      </div>

      {/* Featured review */}
      <SpotlightCard className="mb-4 p-8 lg:p-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3">
              <Image
                src={featured.avatar}
                alt={featured.author}
                width={48}
                height={48}
                className="size-12 rounded-full ring-2 ring-[var(--poc-accent-500)]/40"
              />
              <div>
                <p className="poc-display text-base text-white">{featured.author}</p>
                <p className="poc-mono text-xs text-zinc-400">{featured.date}</p>
              </div>
            </div>
            <div className="mt-5">
              <p className="poc-display text-5xl text-[var(--poc-accent-400)]">
                {featured.rating}
                <span className="poc-display-light text-zinc-500">/10</span>
              </p>
            </div>
          </div>
          <div className="lg:col-span-9">
            <span className="poc-display block text-6xl leading-none text-[var(--poc-accent-500)]">
              &ldquo;
            </span>
            <p className="poc-display-light mt-2 text-2xl leading-snug text-white sm:text-3xl">
              {featured.quote}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Other reviews — compactes */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {others.map((r) => (
          <SpotlightCard key={r.author} className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={r.avatar}
                  alt={r.author}
                  width={36}
                  height={36}
                  className="size-9 rounded-full"
                />
                <div>
                  <p className="poc-display text-sm text-white">{r.author}</p>
                  <p className="poc-mono text-xs text-zinc-400">{r.date}</p>
                </div>
              </div>
              <p className="poc-display text-2xl text-[var(--poc-accent-400)]">
                {r.rating}
                <span className="text-sm text-zinc-500">/10</span>
              </p>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{r.quote}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}

/* ============================================================================
 * Similar games
 * ============================================================================ */

export function SimilarGamesSection({ game }: { game: PocGameData }) {
  if (game.similarGames.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="poc-kicker mb-3">13 — You might also like</p>
          <h2 className="poc-display text-4xl text-white sm:text-5xl">
            Similar <span className="text-[var(--poc-accent-400)]">games</span>
          </h2>
        </div>
        <Link
          href="#"
          className="poc-mono text-sm text-zinc-400 transition hover:text-white"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {game.similarGames.map((sim) => (
          <Link key={sim.title} href="#" className="poc-game-card">
            <Image
              src={sim.cover}
              alt={sim.title}
              fill
              className="poc-game-card-img"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            <div className="poc-game-card-footer">
              <div>
                <p className="poc-display text-base text-white">{sim.title}</p>
                <p className="poc-mono text-xs text-zinc-400">{sim.year}</p>
              </div>
              <span className="poc-game-card-arrow text-white">
                <Arrow />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 5l7 7-7 7"
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
