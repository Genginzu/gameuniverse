"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableGame } from "@/hooks/useCharacterForm";
import { AssignedGameRow, GameSearchPicker } from "./CharacterGameParts";
import { Icon } from "@iconify/react";

interface GamesTabProps extends CharacterFormTabProps {
  availableGames: AvailableGame[];
}

export function CharacterFormGamesTab({ form, t, availableGames }: GamesTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedGames = form.watch("games");

  const assignedIds = watchedGames.map((g) => g.game_id);
  const assignedGames = assignedIds.map((id) => availableGames.find((g) => g.id === id)).filter(Boolean) as AvailableGame[];
  const unassignedGames = availableGames.filter((g) => !assignedIds.includes(g.id));

  const addGame = (gameId: string) => {
    const current = form.getValues("games");
    form.setValue("games", [...current, { game_id: gameId, is_primary: current.length === 0 }], {
      shouldValidate: true,
    });
    setShowPicker(false);
  };

  const removeGame = (gameId: string) => {
    const current = form.getValues("games");
    const updated = current.filter((g) => g.game_id !== gameId);
    if (updated.length > 0 && !updated.some((g) => g.is_primary)) updated[0].is_primary = true;
    form.setValue("games", updated, { shouldValidate: true });
  };

  const togglePrimary = (gameId: string) => {
    const current = form.getValues("games");
    form.setValue("games", current.map((g) => ({ ...g, is_primary: g.game_id === gameId })), { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      {assignedGames.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t("noGames") ?? "Aucun jeu associé"}</p>
      ) : (
        <div className="space-y-2">
          {assignedGames.map((game) => {
            const isPrimary = watchedGames.some((g) => g.game_id === game.id && g.is_primary);
            return <AssignedGameRow key={game.id} game={game} isPrimary={isPrimary} onTogglePrimary={() => togglePrimary(game.id)} onRemove={() => removeGame(game.id)} t={t} />;
          })}
        </div>
      )}
      {showPicker ? (
        <GameSearchPicker availableGames={unassignedGames} onSelect={addGame} onClose={() => setShowPicker(false)} t={t} />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowPicker(true)} className="gap-1.5" disabled={unassignedGames.length === 0}>
          <Icon icon="fa:plus" className="h-3 w-3" />{t("addGame") ?? "Ajouter un jeu"}
        </Button>
      )}
      {form.formState.errors.games && (
        <p className="text-destructive text-sm font-medium">
          {form.formState.errors.games.message}
        </p>
      )}
    </div>
  );
}
