"use client";

import { useState } from "react";
import { GamePlaytime as GamePlaytimeType } from "@/types/game";
import { usePlayerPlaytime } from "@/hooks/usePlayerPlaytime";
import { useAuth } from "@/hooks/useAuth";
import { GamePlaytimeOfficial } from "./GamePlaytimeOfficial";
import { GamePlaytimePlayers } from "./GamePlaytimePlayers";
import { PlayerPlaytimeForm } from "./PlayerPlaytimeForm";

interface GamePlaytimeProps {
  playtime: GamePlaytimeType | null | undefined;
  accentColor: string;
  slug: string;
}

/**
 * Orchestrateur : affiche IGDB et joueurs côte à côte,
 * et gère le Dialog de soumission de temps de jeu.
 */
export function GamePlaytime({
  playtime,
  accentColor,
  slug,
}: GamePlaytimeProps) {
  const { user } = useAuth();
  const { stats, loading, error, submitting, submitPlaytime } =
    usePlayerPlaytime(slug);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <GamePlaytimeOfficial playtime={playtime} accentColor={accentColor} />

        <GamePlaytimePlayers
          stats={stats}
          loading={loading}
          isAuthenticated={!!user}
          accentColor={accentColor}
          showAddButton={!!user}
          onAddPlaytime={() => setDialogOpen(true)}
        />
      </div>

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
