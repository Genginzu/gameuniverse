"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FaPlus, FaTimes } from "react-icons/fa";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableGame } from "@/hooks/useCharacterForm";

interface GamesTabProps extends CharacterFormTabProps {
  availableGames: AvailableGame[];
}

export function CharacterFormGamesTab({ form, t, availableGames }: GamesTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedGames = form.watch("games");

  const assignedIds = watchedGames.map((g) => g.game_id);
  const assignedGames = assignedIds
    .map((id) => availableGames.find((g) => g.id === id))
    .filter(Boolean) as AvailableGame[];
  const unassignedGames = availableGames.filter((g) => !assignedIds.includes(g.id));

  const addGame = (gameId: string) => {
    const current = form.getValues("games");
    // First game added becomes primary by default
    const isPrimary = current.length === 0;
    form.setValue("games", [...current, { game_id: gameId, is_primary: isPrimary }], {
      shouldValidate: true,
    });
    setShowPicker(false);
  };

  const removeGame = (gameId: string) => {
    const current = form.getValues("games");
    const updated = current.filter((g) => g.game_id !== gameId);
    // If we removed the primary game, make the first remaining one primary
    if (updated.length > 0 && !updated.some((g) => g.is_primary)) {
      updated[0].is_primary = true;
    }
    form.setValue("games", updated, { shouldValidate: true });
  };

  const togglePrimary = (gameId: string) => {
    const current = form.getValues("games");
    form.setValue(
      "games",
      current.map((g) => ({ ...g, is_primary: g.game_id === gameId })),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-4">
      {assignedGames.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noGames") ?? "Aucun jeu associé"}
        </p>
      ) : (
        <div className="space-y-2">
          {assignedGames.map((game) => {
            const isPrimary = watchedGames.some((g) => g.game_id === game.id && g.is_primary);
            return (
              <div
                key={game.id}
                className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  {game.coverImage && (
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="h-10 w-8 rounded border border-gray-200 object-cover dark:border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {game.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <Checkbox
                      checked={isPrimary}
                      onCheckedChange={() => togglePrimary(game.id)}
                      aria-label={`${game.title} - ${t("primaryGame") ?? "Jeu principal"}`}
                    />
                    {t("primaryGame") ?? "Jeu principal"}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeGame(game.id)}
                    className="ml-1 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    aria-label={`Remove ${game.title}`}
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPicker ? (
        <GamePicker
          availableGames={unassignedGames}
          onSelect={addGame}
          onClose={() => setShowPicker(false)}
          t={t}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-1.5"
          disabled={unassignedGames.length === 0}
        >
          <FaPlus className="h-3 w-3" />
          {t("addGame") ?? "Ajouter un jeu"}
        </Button>
      )}

      {form.formState.errors.games && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.games.message}
        </p>
      )}
    </div>
  );
}

function GamePicker({
  availableGames,
  onSelect,
  onClose,
  t,
}: {
  availableGames: AvailableGame[];
  onSelect: (gameId: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("addGame") ?? "Ajouter un jeu"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <FaTimes className="h-3 w-3" />
        </button>
      </div>
      {availableGames.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allGamesAdded") ?? "Tous les jeux sont déjà ajoutés"}
        </p>
      ) : (
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onSelect(e.target.value);
          }}
        >
          <option value="" disabled>
            {t("selectGame") ?? "Sélectionner un jeu..."}
          </option>
          {availableGames.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
