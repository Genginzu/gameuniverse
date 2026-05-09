/**
 * Page POC home — vitrine inspirée d'Imba.
 *
 * Tous les éléments sont mockés (aucun fetch SWR ni service métier).
 * La page utilise l'accent magenta (couleur "marque" du site).
 */

import Image from "next/image";
import Link from "next/link";
import { DynamicAccent, MAGENTA_PALETTE } from "@/components/design-poc/DynamicAccent";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { EditorialHero } from "@/components/design-poc/EditorialHero";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";
import { Marquee } from "@/components/design-poc/Marquee";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const TRENDING_GAMES = [
  {
    title: "Cyberpunk 2077",
    slug: "cyberpunk-2077",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
  },
  {
    title: "Valorant",
    slug: "valorant",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0g.webp",
  },
  {
    title: "Counter-Strike 2",
    slug: "counter-strike-2",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co70d9.webp",
  },
  {
    title: "Rocket League",
    slug: "rocket-league",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1mxe.webp",
  },
];

const SERVICES = [
  {
    num: "01",
    title: "Trending\ngames",
    description:
      "Suivez en temps réel les jeux les plus joués, notés et discutés par la communauté.",
  },
  {
    num: "02",
    title: "Esport\nplayers",
    description:
      "Profils, stats, historique d'équipe : tout sur les pros qui font vibrer la scène.",
  },
  {
    num: "03",
    title: "Player\nlibrary",
    description:
      "Votre bibliothèque, vos collections, votre historique. Tout au même endroit.",
  },
];

const STATS = [
  { value: "12k+", label: "Players" },
  { value: "3 200", label: "Games" },
  { value: "180+", label: "Pro teams" },
  { value: "47", label: "Tournaments" },
];

const NEWS = [
  {
    date: "May 09, 2026",
    title: "Cyberpunk 2078 announced — what we know about the sequel",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80",
  },
  {
    date: "May 07, 2026",
    title: "Valorant Champions 2026 : the schedule and the favorites",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
  },
  {
    date: "May 04, 2026",
    title: "Top 10 community-rated indie games of the spring",
    image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80",
  },
];

export default async function DesignPocHomePage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <DynamicAccent palette={MAGENTA_PALETTE}>
      <PocHeader locale={locale} pageLabel="Home / Showcase" />

      <EditorialHero
        kicker="Welcome to the new — gamers universe"
        parts={[
          { type: "text", value: "Welcome" },
          {
            type: "image",
            src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
            alt: "gaming",
          },
          { type: "text", value: "to" },
          { type: "break" },
          { type: "text", value: "Gamers", accent: true },
          { type: "text", value: "Universe" },
        ]}
        description="The home of every gamer : trending titles, esport scene, communities and your own library — all in one place."
        ctas={
          <>
            <Link href={`/${locale}/design-poc/game`} className="poc-pill poc-pill-primary">
              Explore games
              <Arrow />
            </Link>
            <Link href={`/${locale}/design-poc/player`} className="poc-pill poc-pill-ghost">
              Your profile
            </Link>
          </>
        }
        backgroundImage="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80"
        backgroundAlt="Gaming setup"
      />

      {/* SECTION SERVICES NUMEROTES =========================================== */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="poc-kicker mb-4">Our universe</p>
            <h2 className="poc-display text-4xl text-white sm:text-5xl lg:text-6xl">
              Main <span className="text-[var(--poc-accent-400)]">services</span> of the platform
            </h2>
          </div>
          <Link
            href={`/${locale}/design-poc/game`}
            className="poc-mono text-sm text-zinc-400 transition hover:text-white"
          >
            View all features →
          </Link>
        </div>

        <div className="poc-divider" />
        {SERVICES.map((service, idx) => (
          <div
            key={service.num}
            className={`poc-row group grid grid-cols-[auto_1fr_2fr_auto] items-center gap-4 py-8 transition-colors lg:gap-12 ${
              idx === 1 ? "is-active" : ""
            }`}
          >
            <span className="poc-num">{service.num}</span>
            <h3 className="poc-display whitespace-pre-line text-2xl leading-tight text-white sm:text-3xl">
              {service.title}
            </h3>
            <p className="hidden text-sm text-zinc-400 lg:block">{service.description}</p>
            <span className="grid size-12 place-items-center rounded-full border border-white/10 text-zinc-400 transition group-hover:border-[var(--poc-accent-400)] group-hover:text-[var(--poc-accent-400)]">
              <Arrow />
            </span>
            <div className="poc-divider col-span-4" />
          </div>
        ))}
      </section>

      {/* GRID 4 JEUX TRENDING ================================================ */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-24 lg:px-12 lg:pb-32">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {TRENDING_GAMES.map((game) => (
            <Link
              key={game.slug}
              href={`/${locale}/design-poc/game?accent=magenta`}
              className="poc-game-card"
            >
              <Image
                src={game.cover}
                alt={game.title}
                fill
                className="poc-game-card-img"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
              <div className="poc-game-card-footer">
                <span className="poc-display text-lg text-white">{game.title}</span>
                <span className="poc-game-card-arrow text-white">
                  <Arrow />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MARQUEE =========================================================== */}
      <section className="relative overflow-hidden border-y border-white/5 bg-[var(--poc-accent-500)]/15 py-12">
        <Marquee>
          <span className="poc-display text-[clamp(4rem,9vw,9rem)] leading-none text-white">
            it&apos;s time to
          </span>
          <span
            className="poc-display text-[clamp(4rem,9vw,9rem)] leading-none"
            style={{ color: "var(--poc-accent-300)" }}
          >
            level up
          </span>
          <span className="poc-display text-[clamp(4rem,9vw,9rem)] leading-none text-white">
            ✦
          </span>
          <span className="poc-display-light text-[clamp(4rem,9vw,9rem)] leading-none text-white/60 italic">
            level up
          </span>
          <span className="poc-display text-[clamp(4rem,9vw,9rem)] leading-none text-white">
            ✦
          </span>
        </Marquee>
      </section>

      {/* SPLIT CTA / WHAT WE DO =============================================== */}
      <section className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-32">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/5">
          <Image
            src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80"
            alt="Gaming room"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="poc-scanlines" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="poc-kicker mb-4">What we do</p>
          <h2 className="poc-display text-4xl text-white sm:text-5xl lg:text-6xl">
            We build the place where{" "}
            <span className="bg-gradient-to-r from-[var(--poc-accent-300)] to-[var(--poc-accent-500)] bg-clip-text text-transparent">
              every gamer
            </span>{" "}
            belongs.
          </h2>
          <p className="mt-6 max-w-md text-zinc-400 leading-relaxed">
            Une bibliothèque de jeux suivie automatiquement, des profils joueurs riches, une scène
            esport vivante et une communauté qui partage ses expériences.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/design-poc/player`} className="poc-pill poc-pill-primary">
              See a profile
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS COUNTERS ===================================================== */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-12 lg:px-12">
        <div className="poc-divider" />
        <div className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="poc-display text-5xl text-white sm:text-6xl lg:text-7xl">
                {stat.value}
              </p>
              <p className="poc-kicker mt-3">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="poc-divider" />
      </section>

      {/* NEWS GRID ========================================================= */}
      <section className="mx-auto w-full max-w-[1600px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="mb-12 text-center">
          <p className="poc-kicker mb-3">Latest from the universe</p>
          <h2 className="poc-display text-4xl text-white sm:text-5xl lg:text-6xl">
            Community <span className="text-[var(--poc-accent-400)]">news</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {NEWS.map((item) => (
            <SpotlightCard key={item.title} className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <div className="p-5">
                <p className="poc-mono text-xs text-zinc-400">
                  BLOG · {item.date}
                </p>
                <h3 className="poc-display mt-3 text-xl leading-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--poc-accent-400)]">
                  Read more <Arrow />
                </p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* FINAL CTA ========================================================== */}
      <section className="relative mx-auto mb-16 w-full max-w-[1600px] overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[var(--poc-accent-700)]/40 via-[var(--poc-accent-800)]/30 to-[#120821] px-6 py-16 lg:px-12 lg:py-24">
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-50">
          <Image
            src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80"
            alt=""
            width={500}
            height={500}
            className="size-[400px] rounded-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-xl">
          <h2 className="poc-display text-4xl text-white sm:text-5xl">
            Join Gamers Universe — it&apos;s free
          </h2>
          <p className="mt-4 text-zinc-300">
            Crée ton profil, suis tes jeux, échange avec la communauté.
          </p>
          <Link
            href={`/${locale}/design-poc/player`}
            className="poc-pill poc-pill-primary mt-8 inline-flex"
          >
            Get started
            <Arrow />
          </Link>
        </div>
      </section>

      <PocFooter />
    </DynamicAccent>
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
