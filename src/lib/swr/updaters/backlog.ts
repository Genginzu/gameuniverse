import type { BacklogGame, BacklogPriority, BacklogResponse } from "@/types/backlog";

/** Predicted backlog once the server confirms the new order; unknown ids are skipped. */
export function backlogReorderUpdater(orderedGameIds: string[]) {
  return (current: BacklogResponse | undefined): BacklogResponse | undefined => {
    if (!current) return current;
    const byId = new Map(current.games.map((game) => [game.id, game]));
    const games: BacklogGame[] = [];
    orderedGameIds.forEach((id, index) => {
      const game = byId.get(id);
      if (game) games.push({ ...game, backlogPosition: index });
    });
    return { ...current, games };
  };
}

/** Predicted backlog once the server confirms the priority change. */
export function backlogPriorityUpdater(gameId: string, priority: BacklogPriority) {
  return (current: BacklogResponse | undefined): BacklogResponse | undefined =>
    current && {
      ...current,
      games: current.games.map((game) => (game.id === gameId ? { ...game, priority } : game)),
    };
}
