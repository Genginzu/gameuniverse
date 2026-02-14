"use client";

import { useState } from "react";
import { GamePlaytime as GamePlaytimeType } from "@/types/game";
import { usePlayerPlaytime } from "@/hooks/usePlayerPlaytime";
import { useAuth } from "@/hooks/useAuth";
import { GamePlaytimeOfficial } from "./GamePlaytimeOfficial";
import { GamePlaytimePlayers } from "./GamePlaytimePlayers";
import { GamePlaytimeContributors } from "./GamePlaytimeContributors";
import { PlayerPlaytimeForm } from "./PlayerPlaytimeForm";

interface GamePlaytimeProps {
  playtime: GamePlaytimeType | null | undefined;
  accentColor: string;
  slug: string;
}

/**
 * Orchestrateur : affiche IGDB et joueurs côte à côte,
 * séparateur, puis liste des contributeurs individuels.
 */
export function GamePlaytime({ playtime, accentColor, slug }: GamePlaytimeProps) {
  const { user } = useAuth();
  const { stats, loading, error, submitting, submitPlaytime } = usePlayerPlaytime(slug);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasContributors = stats.contributors.length > 0;

  return (
    <div className="space-y-6">
      {/* Deux colonnes de moyennes côte à côte */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <GamePlaytimeOfficial playtime={playtime} accentColor={accentColor} />

        <GamePlaytimePlayers
          stats={stats}
          loading={loading}
          accentColor={accentColor}
          showAddButton={!!user}
          onAddPlaytime={() => setDialogOpen(true)}
        />
      </div>

      {/* Séparateur + contributeurs individuels sous les deux colonnes */}
      {hasContributors && (
        <>
          <hr className="border-slate-700" />
          <GamePlaytimeContributors contributors={stats.contributors} />
        </>
      )}

      {user && (
        <PlayerPlaytimeForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentPlaytime={stats.userPlaytime}
          submitting={submitting}
          error={error}
          onSubmit={submitPlaytime}
        />
      )}
    </div>
  );
}
