/**
 * Sections du milieu de page : About (description+storyline), Stats Bento,
 * Languages, Age Ratings, Playtime.
 */

import Image from "next/image";
import { SpotlightCard } from "@/components/design-poc/SpotlightCard";
import type { PocGameData } from "./game-data";

/* ============================================================================
 * About — description + storyline format magazine
 * ============================================================================ */

export function AboutSection({ game }: { game: PocGameData }) {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 py-20 lg:px-12 lg:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p className="poc-kicker mb-4">01 — About</p>
          <h2 className="poc-display text-4xl text-white sm:text-5xl">
            The <span className="text-[var(--poc-accent-400)]">story</span>
          </h2>
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-zinc-300 lg:col-span-9 lg:columns-2 lg:gap-12">
          <p className="text-2xl text-white">{game.description}</p>
          <p>{game.storyline}</p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * Stats Bento — metascore, prix mini, age, plateformes, devs/publishers
 * ============================================================================ */

export function StatsBento({ game }: { game: PocGameData }) {
  const cheapest =
    game.pricing.length > 0
      ? game.pricing.reduce((min, p) => (p.price < min.price ? p : min), game.pricing[0])
      : null;
  const pegi = game.ageRatings.find((r) => r.system === "PEGI") ?? game.ageRatings[0];

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <p className="poc-kicker mb-6">02 — At a glance</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {/* Metascore — large */}
        <SpotlightCard className="col-span-2 row-span-2 p-8 lg:p-10">
          <p className="poc-kicker mb-3">Metascore</p>
          <p className="poc-display text-7xl text-white lg:text-9xl">
            {game.metascore}
            <span className="poc-display-light text-zinc-500">/100</span>
          </p>
          <p className="mt-4 text-zinc-400">
            {game.metascore >= 90
              ? "Exceptional — among the best of the year."
              : game.metascore >= 75
                ? "Excellent — broadly acclaimed by press and players."
                : game.metascore >= 60
                  ? "Good — solid recommendations from the press."
                  : "Mixed — read multiple reviews before committing."}
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <p className="poc-kicker mb-3">Lowest price</p>
          <p className="poc-display text-3xl text-[var(--poc-accent-400)]">
            {cheapest ? formatPrice(cheapest.price, cheapest.currency) : "—"}
          </p>
          {cheapest?.discount && (
            <p className="poc-mono mt-1 text-xs text-zinc-400">−{cheapest.discount}%</p>
          )}
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <p className="poc-kicker mb-3">Age</p>
          <p className="poc-display text-3xl text-white">
            {pegi?.system} {pegi?.minimumAge ?? pegi?.rating}+
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <p className="poc-kicker mb-3">Released</p>
          <p className="poc-display text-3xl text-white">
            {new Date(game.releaseDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            })}
            <span className="poc-display-light text-zinc-500">
              {" "}
              {new Date(game.releaseDate).getFullYear()}
            </span>
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <p className="poc-kicker mb-3">Platforms</p>
          <div className="flex flex-wrap gap-1">
            {game.platforms.map((p) => (
              <span
                key={p.id}
                className="poc-mono rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase text-zinc-200"
              >
                {p.abbreviation}
              </span>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <p className="poc-kicker mb-3">Developer</p>
          <p className="poc-display text-xl text-white">{game.developers[0]}</p>
          {game.publishers[0] !== game.developers[0] && (
            <>
              <p className="poc-kicker mt-3">Publisher</p>
              <p className="poc-display text-base text-zinc-300">{game.publishers[0]}</p>
            </>
          )}
        </SpotlightCard>

        <SpotlightCard className="p-6 col-span-2 md:col-span-2">
          <p className="poc-kicker mb-3">Genres</p>
          <div className="flex flex-wrap gap-2">
            {game.genres.map((g) => (
              <span
                key={g.id}
                className="poc-mono rounded-full border border-[var(--poc-accent-500)]/30 bg-[var(--poc-accent-500)]/10 px-3 py-1 text-xs uppercase text-[var(--poc-accent-200)]"
              >
                {g.name}
              </span>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}

/* ============================================================================
 * Age Ratings — badges PEGI/ESRB + descriptors
 * ============================================================================ */

export function AgeRatingsSection({ game }: { game: PocGameData }) {
  if (game.ageRatings.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p className="poc-kicker mb-4">03 — Age ratings</p>
          <h2 className="poc-display text-3xl text-white sm:text-4xl">
            Mature <span className="text-[var(--poc-accent-400)]">audiences</span>
          </h2>
        </div>
        <div className="lg:col-span-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {game.ageRatings.map((rating) => (
            <SpotlightCard key={rating.system} className="p-6">
              <div className="flex items-start gap-5">
                <div
                  className="grid size-20 shrink-0 place-items-center rounded-2xl border-2 border-[var(--poc-accent-400)] text-center"
                  style={{ background: "rgba(var(--poc-accent-glow), 0.1)" }}
                >
                  <div>
                    <p className="poc-mono text-[10px] uppercase tracking-widest text-[var(--poc-accent-300)]">
                      {rating.system}
                    </p>
                    <p className="poc-display text-3xl text-white">{rating.rating}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="poc-display text-xl text-white">
                    {rating.minimumAge ? `${rating.minimumAge}+` : rating.rating}
                  </p>
                  <p className="poc-kicker mt-2">Content descriptors</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {rating.descriptors.map((d) => (
                      <li
                        key={d}
                        className="poc-mono rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-zinc-300"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
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
 * Languages — table responsive avec checkmarks
 * ============================================================================ */

export function LanguagesSection({ game }: { game: PocGameData }) {
  if (game.languages.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p className="poc-kicker mb-4">04 — Languages</p>
          <h2 className="poc-display text-3xl text-white sm:text-4xl">
            Available <span className="text-[var(--poc-accent-400)]">worldwide</span>
          </h2>
          <p className="mt-4 text-sm text-zinc-400">
            {game.languages.length} languages supported
          </p>
        </div>
        <div className="lg:col-span-9">
          <SpotlightCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="poc-kicker px-5 py-4 font-medium">Language</th>
                    <th className="poc-kicker px-5 py-4 text-center font-medium">Interface</th>
                    <th className="poc-kicker px-5 py-4 text-center font-medium">Audio</th>
                    <th className="poc-kicker px-5 py-4 text-center font-medium">Subtitles</th>
                  </tr>
                </thead>
                <tbody>
                  {game.languages.map((lang) => (
                    <tr key={lang.code} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-4 text-white">{lang.name}</td>
                      <td className="px-5 py-4 text-center">
                        {lang.interface ? <Check /> : <Dash />}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {lang.audio ? <Check /> : <Dash />}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {lang.subtitles ? <Check /> : <Dash />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * Playtime — IGDB officiel + community avg + contributeurs
 * ============================================================================ */

export function PlaytimeSection({ game }: { game: PocGameData }) {
  const { official, community, contributors } = game.playtime;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 lg:px-12 lg:pb-28">
      <p className="poc-kicker mb-6">05 — How long is this game?</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Officiel IGDB */}
        {official && (
          <SpotlightCard className="p-6 lg:p-8">
            <p className="poc-kicker mb-2">Official · HowLongToBeat</p>
            <h3 className="poc-display mb-6 text-3xl text-white">Estimated duration</h3>
            <ul className="divide-y divide-white/5">
              <PlaytimeRow label="Main story" hours={official.mainStory} />
              <PlaytimeRow label="Main + sides" hours={official.mainSides} />
              <PlaytimeRow label="Completionist" hours={official.completionist} accent />
            </ul>
          </SpotlightCard>
        )}

        {/* Community */}
        {community && (
          <SpotlightCard className="p-6 lg:p-8">
            <p className="poc-kicker mb-2">Community average</p>
            <h3 className="poc-display mb-6 text-3xl text-white">From {community.sample} players</h3>
            <p className="poc-display text-7xl text-[var(--poc-accent-400)]">
              {community.avg}h
            </p>

            {contributors.length > 0 && (
              <div className="mt-6">
                <p className="poc-kicker mb-3">Top contributors</p>
                <div className="flex flex-wrap items-center gap-3">
                  {contributors.slice(0, 5).map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] py-1 pr-3 pl-1"
                    >
                      <Image
                        src={c.avatar}
                        alt={c.name}
                        width={28}
                        height={28}
                        className="size-7 rounded-full"
                      />
                      <span className="poc-mono text-xs text-zinc-300">
                        {c.name} · {c.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SpotlightCard>
        )}
      </div>
    </section>
  );
}

function PlaytimeRow({
  label,
  hours,
  accent,
}: {
  label: string;
  hours: number;
  accent?: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between py-3">
      <span className="text-zinc-300">{label}</span>
      <span
        className={`poc-display text-3xl ${
          accent ? "text-[var(--poc-accent-400)]" : "text-white"
        }`}
      >
        {hours}
        <span className="text-base text-zinc-500">h</span>
      </span>
    </li>
  );
}

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="mx-auto text-[var(--poc-accent-400)]"
    >
      <path
        d="m5 12 5 5L20 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dash() {
  return <span className="text-zinc-600">—</span>;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(price);
}
