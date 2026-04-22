"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { COACH_SPECIALTY_GROUPS, type CoachGame } from "@/types/coaching";

export function CoachGamesSection() {
  const t = useTranslations("coaching.settings.games");
  const { data, isLoading, mutate } = useSWR<{ games: CoachGame[] }>("/api/coaching/games", fetcher);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; coverImage: string | null }>>([]);

  const searchGames = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`/api/games?search=${encodeURIComponent(q)}&limit=5&locale=fr`);
    const json = await res.json();
    setSearchResults(json.games?.map((g: { id: string; title: string; coverImage: string | null }) => ({ id: g.id, title: g.title, coverImage: g.coverImage })) ?? []);
  };

  const addGame = async (gameId: string) => {
    await fetch("/api/coaching/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, rankLevel: "", hoursExperience: 0, specialties: [] }) });
    setAdding(false);
    setSearch("");
    setSearchResults([]);
    await mutate();
  };

  const removeGame = async (gameId: string) => {
    await fetch(`/api/coaching/games/${gameId}`, { method: "DELETE" });
    await mutate();
  };

  const toggleSpecialty = async (game: CoachGame, specialty: string) => {
    const newSpecialties = game.specialties.includes(specialty) ? game.specialties.filter((s) => s !== specialty) : [...game.specialties, specialty];
    // Optimistic update
    mutate((prev: { games: CoachGame[] } | undefined) => {
      if (!prev) return prev;
      return { games: prev.games.map((g) => g.id === game.id ? { ...g, specialties: newSpecialties } : g) };
    }, false);
    fetch(`/api/coaching/games/${game.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ specialties: newSpecialties }) });
  };

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white">
          <Icon icon="lucide:plus" className="size-4" /> {t("addGame")}
        </button>
      </div>

      {adding && (
        <div className="glass-card space-y-2 rounded-xl p-4">
          <input value={search} onChange={(e) => searchGames(e.target.value)} className="glass-input w-full rounded-lg p-3 text-base" placeholder={t("searchPlaceholder")} />
          {searchResults.map((game) => (
            <button key={game.id} onClick={() => addGame(game.id)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/40 dark:hover:bg-slate-700/40">
              {game.coverImage && <img src={game.coverImage} alt="" className="h-10 w-7 rounded object-cover" />}
              <span className="text-sm text-gray-900 dark:text-white">{game.title}</span>
            </button>
          ))}
        </div>
      )}

      {data?.games.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:gamepad-2" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data?.games.map((game) => (
            <div key={game.id} className="glass-card space-y-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {game.game?.coverImage && <img src={game.game.coverImage} alt="" className="h-14 w-10 rounded-lg object-cover" />}
                  <span className="font-medium text-gray-900 dark:text-white">{game.game?.title ?? game.gameId}</span>
                </div>
                <button onClick={() => removeGame(game.id)} className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500">
                  <Icon icon="lucide:trash-2" className="size-4" />
                </button>
              </div>
              <div className="space-y-2">
                {COACH_SPECIALTY_GROUPS.map((group) => (
                  <div key={group.key} className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t(`categories.${group.key}`)}</span>
                    <div className="flex flex-wrap gap-1.5">
                    {group.specialties.map((s) => (
                      <button key={s} onClick={() => toggleSpecialty(game, s)} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${game.specialties.includes(s) ? "bg-cyan-500/20 text-cyan-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {t(`specialties.${s}`)}
                      </button>
                    ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
