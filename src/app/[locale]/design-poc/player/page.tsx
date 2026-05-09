/**
 * Page POC player — profil joueur asymétrique style éditorial.
 * Accent doré (palette gold) pour évoquer rang/prestige.
 */

import Image from "next/image";
import Link from "next/link";
import { DynamicAccent, GOLD_PALETTE } from "@/components/design-poc/DynamicAccent";
import { PocHeader } from "@/components/design-poc/PocHeader";
import { PocFooter } from "@/components/design-poc/PocFooter";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const RECENT_GAMES = [
  {
    title: "Cyberpunk 2077",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rcz.webp",
    hours: "84h",
    progress: 78,
  },
  {
    title: "Valorant",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0g.webp",
    hours: "312h",
    progress: 100,
  },
  {
    title: "Counter-Strike 2",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co70d9.webp",
    hours: "147h",
    progress: 45,
  },
];

const ACHIEVEMENTS = [
  { name: "Night City Legend", game: "Cyberpunk 2077", icon: "★" },
  { name: "Diamond Rank", game: "Valorant", icon: "◆" },
  { name: "Marathon Player", game: "Universal", icon: "✦" },
  { name: "First Victory Royale", game: "Fortnite", icon: "♛" },
];

export default async function DesignPocPlayerPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <DynamicAccent palette={GOLD_PALETTE}>
      <PocHeader locale={locale} pageLabel="Player / Profile" />

      {/* HERO PROFIL ASYMETRIQUE =========================================== */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 pt-24 lg:px-12 lg:pb-24 lg:pt-32">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Avatar + frame */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80"
                alt="Player avatar"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
              <div className="poc-scanlines" />
              {/* Frame glow */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_rgba(251,191,36,0.25)]" />
              {/* Live status */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                <span className="size-2 animate-pulse rounded-full bg-[var(--poc-accent-400)]" />
                <span className="poc-mono text-xs uppercase text-white">In game</span>
              </div>
              {/* Rank badge */}
              <div className="absolute bottom-4 right-4 rounded-full border border-[var(--poc-accent-400)] bg-[var(--poc-accent-500)]/20 px-4 py-2 backdrop-blur-md">
                <p className="poc-mono text-xs uppercase tracking-widest text-[var(--poc-accent-100)]">
                  ◆ Diamond III
                </p>
              </div>
            </div>
          </div>

          {/* Identité / titre */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="poc-kicker mb-4">Player profile · Lvl 47</p>
            <h1 className="poc-display text-[clamp(3rem,8vw,7rem)] leading-[0.92] text-white">
              <span>Lyra</span>{" "}
              <span className="bg-gradient-to-r from-[var(--poc-accent-300)] to-[var(--poc-accent-500)] bg-clip-text text-transparent">
                Nightwhisper
              </span>
            </h1>
            <p className="poc-display-light mt-6 max-w-xl text-2xl text-zinc-300 italic">
              &laquo; Strategy is just timing made visible. &raquo;
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="poc-pill poc-pill-primary">
                Send friend request
                <Plus />
              </button>
              <button className="poc-pill poc-pill-ghost">Send message</button>
            </div>

            {/* Mini stats */}
            <div className="poc-divider mt-12" />
            <div className="grid grid-cols-3 gap-6 py-6">
              <Stat label="Games" value="247" />
              <Stat label="Hours" value="3 218" />
              <Stat label="Trophies" value="89" accent />
            </div>
            <div className="poc-divider" />
          </div>
        </div>
      </section>

      {/* BENTO ============================================================ */}
      <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 lg:px-12 lg:pb-24">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent games (large) */}
          <SpotlightCard className="md:col-span-2 lg:row-span-2 p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="poc-kicker mb-2">Recently played</p>
                <h2 className="poc-display text-3xl text-white">Last games</h2>
              </div>
              <Link
                href={`/${locale}/design-poc/home`}
                className="poc-mono text-xs text-zinc-400 hover:text-white"
              >
                Library →
              </Link>
            </div>
            <ul className="divide-y divide-white/5">
              {RECENT_GAMES.map((g) => (
                <li key={g.title} className="flex items-center gap-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={g.cover} alt={g.title} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="poc-display truncate text-xl text-white">{g.title}</p>
                    <p className="poc-mono text-xs text-zinc-400">{g.hours} played</p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="poc-divider relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--poc-accent-400)]"
                        style={{ width: `${g.progress}%`, height: "1px" }}
                      />
                    </div>
                    <p className="poc-mono mt-1 text-right text-xs text-zinc-500">
                      {g.progress}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SpotlightCard>

          {/* Achievements showcase */}
          <SpotlightCard className="p-6">
            <p className="poc-kicker mb-2">Achievements</p>
            <h2 className="poc-display mb-5 text-3xl text-white">Latest</h2>
            <ul className="space-y-3">
              {ACHIEVEMENTS.slice(0, 3).map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-[var(--poc-accent-500)]/20 text-lg text-[var(--poc-accent-300)]">
                    {a.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="poc-display truncate text-base text-white">{a.name}</p>
                    <p className="poc-mono truncate text-xs text-zinc-400">{a.game}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SpotlightCard>

          {/* Big stat highlight */}
          <SpotlightCard className="p-6 lg:p-8">
            <p className="poc-kicker mb-3">Win rate</p>
            <p className="poc-display text-7xl text-[var(--poc-accent-400)] lg:text-8xl">68%</p>
            <p className="mt-3 text-sm text-zinc-400">
              Sur les 247 derniers matches en compétition.
            </p>
          </SpotlightCard>

          {/* Posts */}
          <SpotlightCard className="md:col-span-2 p-6">
            <p className="poc-kicker mb-2">Latest post</p>
            <p className="poc-display-light text-2xl text-white italic">
              &laquo; Win streak finally broken at 23 ranked games. Time to study replays. &raquo;
            </p>
            <p className="poc-mono mt-4 text-xs text-zinc-500">
              Posted 2 hours ago · 47 reactions
            </p>
          </SpotlightCard>

          {/* Friends count */}
          <SpotlightCard className="p-6">
            <p className="poc-kicker mb-3">Friends</p>
            <p className="poc-display text-6xl text-white">142</p>
            <p className="mt-2 poc-mono text-xs text-zinc-400">12 online now</p>
          </SpotlightCard>
        </div>
      </section>

      <PocFooter />
    </DynamicAccent>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className={`poc-display text-3xl ${
          accent ? "text-[var(--poc-accent-400)]" : "text-white"
        }`}
      >
        {value}
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
