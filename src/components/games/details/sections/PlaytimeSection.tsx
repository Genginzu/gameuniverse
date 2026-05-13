"use client";

/**
 * Section "How long is this game?" : 2 cards côte à côte.
 * - Carte gauche : durées officielles (HowLongToBeat) — 3 lignes hastily/
 *   normally/completely en chiffres display.
 * - Carte droite : moyenne communauté en gros chiffre + contributeurs +
 *   bouton "ajouter mon temps de jeu" (utilisateur connecté).
 */

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { usePlayerPlaytime } from "@/hooks/usePlayerPlaytime";
import { useAuth } from "@/hooks/useAuth";
import { PlayerPlaytimeForm } from "../PlayerPlaytimeForm";
import type { GameDetails } from "@/types/game";

interface PlaytimeSectionProps {
  game: GameDetails;
}

export function PlaytimeSection({ game }: PlaytimeSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const t = useTranslations("gameDetails.playtime");
  const tPlayers = useTranslations("gameDetails.playtime.players");
  const { user } = useAuth();
  const { stats, loading, error, submitting, submitPlaytime } = usePlayerPlaytime(game.slug);
  const [dialogOpen, setDialogOpen] = useState(false);

  const official = game.playtime;
  const hasOfficial =
    official && (official.hastily ?? 0) + (official.normally ?? 0) + (official.completely ?? 0) > 0;
  const hasCommunity = stats && stats.count > 0;

  if (!hasOfficial && !hasCommunity && !loading) return null;

  // Average community : pick the most relevant available value.
  const communityAvg = stats?.averages
    ? (stats.averages.normally ?? stats.averages.hastily ?? stats.averages.completely ?? null)
    : null;

  // Use accent var to avoid passing a hard-coded color to the form.
  const accentColor = game.accentColor ?? "#0697e0";

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <KickerLabel className="mb-6">05 — {tEd("sections.playtime")}</KickerLabel>

      <div className="editorial-game-detail-playtime-grid">
        {/* Officiel HowLongToBeat */}
        {hasOfficial && official && (
          <SpotlightCard className="editorial-game-detail-playtime-card">
            <KickerLabel className="mb-2">{tEd("playtime.officialKicker")}</KickerLabel>
            <h3 className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md mb-6">
              {tEd("playtime.officialTitle")}
            </h3>
            <ul className="editorial-game-detail-playtime-rows">
              {official.hastily !== null && (
                <PlaytimeRow label={t("hastily")} hours={official.hastily} />
              )}
              {official.normally !== null && (
                <PlaytimeRow label={t("normally")} hours={official.normally} />
              )}
              {official.completely !== null && (
                <PlaytimeRow label={t("completely")} hours={official.completely} accent />
              )}
            </ul>
          </SpotlightCard>
        )}

        {/* Communauté */}
        {(hasCommunity || (user && !loading)) && (
          <SpotlightCard className="editorial-game-detail-playtime-card">
            <KickerLabel className="mb-2">{tEd("playtime.communityKicker")}</KickerLabel>

            {hasCommunity && stats && communityAvg !== null ? (
              <>
                <h3 className="editorial-game-detail-bento-display editorial-game-detail-bento-display-md mb-6">
                  {tEd("playtime.communityFromPlayers", { count: stats.count })}
                </h3>
                <p className="editorial-game-detail-playtime-big">
                  {communityAvg.toFixed(1)}
                  <span className="text-3xl text-zinc-500">h</span>
                </p>
              </>
            ) : (
              <p className="text-zinc-400">{tPlayers("noData")}</p>
            )}

            {hasCommunity && stats && stats.contributors.length > 0 && (
              <>
                <KickerLabel className="mt-6 mb-3">{tEd("playtime.topContributors")}</KickerLabel>
                <div className="editorial-game-detail-playtime-contributors">
                  {stats.contributors.slice(0, 5).map((c) => {
                    const hours =
                      c.playtime.normally ?? c.playtime.hastily ?? c.playtime.completely ?? 0;
                    return (
                      <div key={c.userId} className="editorial-game-detail-playtime-contributor">
                        {c.avatarUrl && (
                          <Image src={c.avatarUrl} alt={c.username ?? ""} width={28} height={28} />
                        )}
                        <span>
                          {c.username ?? tPlayers("anonymous")} · {hours.toFixed(1)}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {user && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="editorial-game-detail-cta-ghost mt-6 inline-flex"
              >
                <Icon icon="lucide:plus" className="h-4 w-4" />
                {tPlayers("addPlaytime")}
              </button>
            )}
          </SpotlightCard>
        )}
      </div>

      {user && (
        <PlayerPlaytimeForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentPlaytime={stats.userPlaytime}
          submitting={submitting}
          error={error}
          onSubmit={submitPlaytime}
          accentColor={accentColor}
        />
      )}
    </section>
  );
}

function PlaytimeRow({ label, hours, accent }: { label: string; hours: number; accent?: boolean }) {
  return (
    <li className="editorial-game-detail-playtime-row">
      <span className="editorial-game-detail-playtime-row-label">{label}</span>
      <span className={`editorial-game-detail-playtime-row-value${accent ? "accent" : ""}`}>
        {hours.toFixed(1)}
        <span className="ml-1 text-base text-zinc-500">h</span>
      </span>
    </li>
  );
}
