import type { PandaScoreMatch, PandaScorePlayer } from "../types.ts";
import { chunk, preloadIdMap } from "./persistence.ts";
import type { IngestDeps, PlayerTeamHistoryInput } from "./types.ts";

const SETTLEMENT_CONCURRENCY = 8;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function reconcileTeamHistory(
  deps: IngestDeps,
  players: PandaScorePlayer[],
  teamMap: Map<number, string>,
): Promise<void> {
  const playerMap = await preloadIdMap(
    deps.db,
    "esport_players",
    players.map((p) => p.id),
  );
  const inputs: PlayerTeamHistoryInput[] = players.flatMap((p) => {
    const playerLocalId = playerMap.get(p.id);
    if (!playerLocalId) return [];
    const teamPandaId = p.current_team?.id;
    const newTeamLocalId = teamPandaId ? teamMap.get(teamPandaId) ?? null : null;
    return [{ playerLocalId, newTeamLocalId }];
  });
  if (inputs.length === 0) return;

  try {
    await deps.sideEffects.reconcilePlayerTeamHistory(inputs);
  } catch (error) {
    deps.errors.add({
      type: "player",
      id: null,
      phase: "side_effect",
      error: `Team history reconcile failed for ${inputs.length} players: ${errorMessage(error)}`,
    });
  }
}

export async function settleFinishedMatches(
  deps: IngestDeps,
  matches: PandaScoreMatch[],
): Promise<void> {
  const finished = matches.flatMap((m) =>
    m.status === "finished" && m.winner_id !== null
      ? [{ matchId: m.id, winnerId: m.winner_id }]
      : [],
  );

  for (const batch of chunk(finished, SETTLEMENT_CONCURRENCY)) {
    const settled = await Promise.allSettled(
      batch.map(({ matchId, winnerId }) =>
        deps.sideEffects.resolvePredictionsForMatch(matchId, winnerId),
      ),
    );
    settled.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") return;
      deps.errors.add({
        type: "match",
        id: batch[index].matchId,
        phase: "side_effect",
        error: `Prediction settlement failed: ${errorMessage(outcome.reason)}`,
      });
    });
  }
}
