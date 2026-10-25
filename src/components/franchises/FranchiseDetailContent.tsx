"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { GameCard } from "@/components/games/GameCard";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { FranchiseDetail } from "@/types/franchise";
import type { GameSummary } from "@/types/game";

function toGameSummary(card: FranchiseDetail["games"][number]): GameSummary {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    coverImage: card.coverImage ?? undefined,
    genres: card.genres,
    developer: card.developer,
    publisher: "",
    metascore: card.metascore ?? undefined,
    releaseDate: card.releaseDate ?? undefined,
  };
}

/** Release years of the franchise's first and latest dated games. */
function releaseSpan(games: FranchiseDetail["games"]) {
  const years = games
    .map((game) => (game.releaseDate ? new Date(game.releaseDate).getFullYear() : null))
    .filter((year): year is number => year !== null && !Number.isNaN(year));
  return years.length > 0 ? { first: Math.min(...years), latest: Math.max(...years) } : null;
}

/** `/franchises/[slug]`: editorial header (kicker, accented title, stats) and the games in release order. */
export function FranchiseDetailContent({ franchise }: { franchise: FranchiseDetail }) {
  const t = useTranslations("franchises");
  const games = franchise.games.map(toGameSummary);
  const span = releaseSpan(franchise.games);

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <KickerLabel>{t(franchise.kind === "series" ? "kindSeries" : "kindFranchise")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("detailTitlePrefix")} <span className="text-editorial-accent">{franchise.name}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base leading-relaxed">
              {franchise.description ?? t("detailSubtitle", { name: franchise.name })}
            </p>
          </div>

          <div className="border-editorial-line grid grid-cols-2 gap-6 border-y py-6 md:grid-cols-3">
            <Stat label={t("stats.first")} value={span ? String(span.first) : "—"} />
            <Stat label={t("stats.latest")} value={span ? String(span.latest) : "—"} />
            <Stat label={t("stats.games")} value={String(games.length)} accent />
          </div>
        </header>

        <LibraryStatusProvider gameIds={games.map((game) => game.id)}>
          <ol className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {games.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ol>
        </LibraryStatusProvider>
      </EditorialContainer>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}
