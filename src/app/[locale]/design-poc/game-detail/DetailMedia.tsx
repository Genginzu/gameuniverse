/**
 * Sections média/contenu : Media gallery, Versions, DLC/Extensions, Music.
 */

import Image from "next/image";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";
import type { PocGameData } from "./game-data";

/* ============================================================================
 * Media Gallery — screenshots + videos
 * ============================================================================ */

export function MediaGallery({ game }: { game: PocGameData }) {
  if (game.screenshots.length === 0 && game.videos.length === 0) return null;
  const [first, ...rest] = game.screenshots;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="poc-kicker mb-3">06 — Media</p>
          <h2 className="poc-display text-4xl text-white sm:text-5xl">
            See it in <span className="text-[var(--poc-accent-400)]">action</span>
          </h2>
        </div>
        <p className="poc-mono text-sm text-zinc-400">
          {game.screenshots.length} screenshots · {game.videos.length} videos
        </p>
      </div>

      {/* Layout asymétrique : 1 grand pavé + grille 2x2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {first && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/5 lg:col-span-2 lg:row-span-2 lg:aspect-auto">
            <Image
              src={first}
              alt="Screenshot featured"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(min-width: 1024px) 66vw, 100vw"
            />
            <div className="poc-scanlines" />
          </div>
        )}

        {rest.slice(0, 2).map((src, i) => (
          <div
            key={src + i}
            className="relative aspect-video overflow-hidden rounded-2xl border border-white/5"
          >
            <Image
              src={src}
              alt={`Screenshot ${i + 2}`}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="33vw"
            />
            <div className="poc-scanlines" />
          </div>
        ))}
      </div>

      {/* Videos */}
      {game.videos.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {game.videos.map((video) => (
            <SpotlightCard key={video.title} className="group relative aspect-video overflow-hidden">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid size-16 place-items-center rounded-full bg-[var(--poc-accent-500)] text-white shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5Z" />
                  </svg>
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-5">
                <p className="poc-display text-lg text-white">{video.title}</p>
                <span className="poc-mono rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs text-white backdrop-blur-md">
                  {video.durationLabel}
                </span>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================================
 * Versions / Editions
 * ============================================================================ */

export function VersionsSection({ game }: { game: PocGameData }) {
  if (game.versions.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="mb-8 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p className="poc-kicker mb-4">07 — Editions</p>
          <h2 className="poc-display text-3xl text-white sm:text-4xl">
            Pick your <span className="text-[var(--poc-accent-400)]">version</span>
          </h2>
        </div>
        <div className="lg:col-span-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {game.versions.map((version, i) => (
            <SpotlightCard key={version.name} className="overflow-hidden">
              <div className="relative aspect-[16/9]">
                <Image
                  src={version.cover}
                  alt={version.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                {i === 1 && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ background: "var(--poc-accent-500)" }}
                  >
                    Recommended
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="poc-display text-xl text-white">{version.name}</p>
                <p className="mt-2 text-sm text-zinc-400">{version.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="poc-display text-2xl text-[var(--poc-accent-400)]">
                    {formatPrice(version.price, version.currency)}
                  </span>
                  <button className="poc-mono text-xs uppercase tracking-widest text-zinc-300 hover:text-white">
                    Buy →
                  </button>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * DLC & Extensions
 * ============================================================================ */

export function DlcSection({ game }: { game: PocGameData }) {
  if (game.dlcExtensions.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p className="poc-kicker mb-4">08 — Expansions</p>
          <h2 className="poc-display text-3xl text-white sm:text-4xl">
            DLC &amp; <span className="text-[var(--poc-accent-400)]">extensions</span>
          </h2>
        </div>
        <div className="lg:col-span-9 grid grid-cols-1 gap-4 md:grid-cols-2">
          {game.dlcExtensions.map((dlc) => (
            <SpotlightCard key={dlc.name} className="overflow-hidden">
              <div className="relative aspect-[16/9]">
                <Image
                  src={dlc.cover}
                  alt={dlc.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="poc-mono text-xs text-zinc-300">
                    Released {new Date(dlc.releaseDate).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="poc-display mt-1 text-2xl text-white">{dlc.name}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-zinc-400">{dlc.description}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * Music / OST
 * ============================================================================ */

export function MusicSection({ game }: { game: PocGameData }) {
  if (!game.music) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p className="poc-kicker mb-4">09 — Soundtrack</p>
          <h2 className="poc-display text-3xl text-white sm:text-4xl">
            Original <span className="text-[var(--poc-accent-400)]">score</span>
          </h2>
        </div>
        <div className="lg:col-span-9">
          <SpotlightCard className="p-8 lg:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <p className="poc-kicker mb-2">Composers</p>
                <ul className="space-y-1">
                  {game.music.composers.map((c) => (
                    <li key={c} className="poc-display text-xl text-white">
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="poc-mono mt-6 text-sm text-zinc-400">
                  {game.music.tracksCount} original tracks
                </p>
              </div>
              <div>
                <p className="poc-kicker mb-3">Listen on</p>
                <div className="flex flex-wrap gap-3">
                  {game.music.streamingPlatforms.map((sp) => (
                    <a
                      key={sp.name}
                      href={sp.url}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-[var(--poc-accent-500)] hover:bg-[var(--poc-accent-500)]/10 hover:text-white"
                    >
                      <Icon icon={sp.icon} className="size-5" />
                      {sp.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(price);
}
