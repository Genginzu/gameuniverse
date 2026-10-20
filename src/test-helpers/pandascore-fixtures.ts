import type {
  PandaScoreMatch,
  PandaScorePlayer,
  PandaScoreTeam,
  PandaScoreTournament,
} from "@/lib/pandascore/types";

interface FakeEsportDbOptions {
  ids?: Record<string, Record<number, string>>;
  upsertErrors?: Record<string, string>;
}

export function createFakeEsportDb(options: FakeEsportDbOptions = {}) {
  const upserts: Record<string, Record<string, unknown>[][]> = {};
  const lookups: Record<string, number[][]> = {};

  const db = {
    from(table: string) {
      return {
        upsert: async (rows: Record<string, unknown>[], _options: { onConflict: string }) => {
          upserts[table] = [...(upserts[table] ?? []), rows];
          const message = options.upsertErrors?.[table];
          return { error: message ? { message } : null };
        },
        select: (_columns: string) => ({
          in: async (_column: string, values: number[]) => {
            lookups[table] = [...(lookups[table] ?? []), values];
            const known = options.ids?.[table] ?? {};
            const data = values
              .filter((value) => known[value] !== undefined)
              .map((value) => ({ id: known[value], pandascore_id: value }));
            return { data, error: null };
          },
        }),
      };
    },
  };

  return {
    db,
    upserts,
    lookups,
    rowsFor: (table: string) => (upserts[table] ?? []).flat(),
  };
}

export function team(id: number): PandaScoreTeam {
  return {
    id,
    name: `Team ${id}`,
    slug: `team-${id}`,
    acronym: null,
    image_url: null,
    location: null,
    current_videogame: { id: 1, name: "LoL", slug: "lol" },
  };
}

export function tournament(id: number): PandaScoreTournament {
  return {
    id,
    name: `Tournament ${id}`,
    slug: `tournament-${id}`,
    begin_at: null,
    end_at: null,
    serie_id: 1,
    league_id: 1,
    league: { id: 1, name: "League", slug: "league", image_url: null, url: null },
    serie: {
      id: 1,
      name: "Serie",
      slug: "serie",
      begin_at: null,
      end_at: null,
      full_name: "Serie 2026",
      year: 2026,
    },
    videogame: { id: 1, name: "LoL", slug: "lol" },
    prizepool: null,
    tier: "s",
    winner_id: null,
    winner_type: null,
  };
}

export function player(id: number, teamId: number | null): PandaScorePlayer {
  return {
    id,
    name: `Player ${id}`,
    slug: `player-${id}`,
    first_name: null,
    last_name: null,
    nationality: null,
    image_url: null,
    role: null,
    current_team: teamId === null ? null : team(teamId),
    current_videogame: null,
  };
}

export function match(
  id: number,
  overrides: Partial<PandaScoreMatch> & { teamIds?: [number, number] } = {},
): PandaScoreMatch {
  const [teamA, teamB] = overrides.teamIds ?? [10, 20];
  return {
    id,
    name: `Match ${id}`,
    slug: `match-${id}`,
    status: "not_started",
    match_type: "best_of",
    number_of_games: 3,
    begin_at: null,
    end_at: null,
    tournament_id: 100,
    tournament: tournament(100),
    opponents: [
      { type: "Team", opponent: team(teamA) },
      { type: "Team", opponent: team(teamB) },
    ],
    winner_id: null,
    winner_type: null,
    videogame: { id: 1, name: "LoL", slug: "lol" },
    league: tournament(100).league,
    serie: tournament(100).serie,
    results: [],
    streams_list: [],
    ...overrides,
  };
}
