import { logger } from "@/lib/logger";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export interface GameRank {
  game: string;
  gameSlug: string;
  tier: string;
  rank: string;
  points: number | null;
  iconUrl: string | null;
}

export interface RankAdapter {
  game: string;
  gameSlug: string;
  fetchRank(accountId: string): Promise<GameRank | null>;
}

// -- Riot adapter (LoL, Valorant, TFT) --

function createRiotAdapter(game: string, gameSlug: string, endpoint: string): RankAdapter {
  return {
    game,
    gameSlug,
    async fetchRank(accountId: string): Promise<GameRank | null> {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) return null;

      try {
        const res = await fetch(`${endpoint}/${encodeURIComponent(accountId)}`, {
          headers: { "X-Riot-Token": apiKey },
          cache: "no-store",
        });
        if (!res.ok) return null;

        const data = await res.json();
        const entry = Array.isArray(data) ? data[0] : data;
        if (!entry) return null;

        return {
          game,
          gameSlug,
          tier: entry.tier ?? "Unranked",
          rank: entry.rank ?? "",
          points: entry.leaguePoints ?? null,
          iconUrl: null,
        };
      } catch {
        return null;
      }
    },
  };
}

// -- Blizzard adapter (Overwatch) --

const blizzardAdapter: RankAdapter = {
  game: "Overwatch 2",
  gameSlug: "overwatch-2",
  async fetchRank(accountId: string): Promise<GameRank | null> {
    const token = process.env.BLIZZARD_ACCESS_TOKEN;
    if (!token) return null;

    try {
      const res = await fetch(
        `https://us.api.blizzard.com/profile/overwatch/${encodeURIComponent(accountId)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!res.ok) return null;

      const data = await res.json();
      return {
        game: "Overwatch 2",
        gameSlug: "overwatch-2",
        tier: data.competitive?.rank?.tier ?? "Unranked",
        rank: data.competitive?.rank?.division ?? "",
        points: data.competitive?.rank?.sr ?? null,
        iconUrl: data.competitive?.rank?.icon ?? null,
      };
    } catch {
      return null;
    }
  },
};

// -- Faceit adapter (CS2) --

const faceitAdapter: RankAdapter = {
  game: "CS2",
  gameSlug: "cs2",
  async fetchRank(accountId: string): Promise<GameRank | null> {
    const apiKey = process.env.FACEIT_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch(
        `https://open.faceit.com/data/v4/players/${encodeURIComponent(accountId)}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      );
      if (!res.ok) return null;

      const data = await res.json();
      const csGame = data.games?.cs2 ?? data.games?.csgo;
      if (!csGame) return null;

      return {
        game: "CS2",
        gameSlug: "cs2",
        tier: `Level ${csGame.skill_level ?? "?"}`,
        rank: csGame.faceit_elo ? `${csGame.faceit_elo} ELO` : "",
        points: csGame.faceit_elo ?? null,
        iconUrl: csGame.skill_level_label ? null : null,
      };
    } catch {
      return null;
    }
  },
};

// -- Registry --

export const adapters: RankAdapter[] = [
  createRiotAdapter(
    "League of Legends",
    "league-of-legends",
    "https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner"
  ),
  createRiotAdapter("Valorant", "valorant", "https://api.henrikdev.xyz/valorant/v1/mmr"),
  createRiotAdapter(
    "TFT",
    "tft",
    "https://euw1.api.riotgames.com/tft/league/v1/entries/by-summoner"
  ),
  blizzardAdapter,
  faceitAdapter,
];

/** Fetch ranks for a player across all linked games */
export async function getPlayerGameRanks(
  linkedAccounts: Array<{ game: string; accountId: string }>
): Promise<GameRank[]> {
  if (!linkedAccounts.length) return [];

  const cacheKey = `ranks:${linkedAccounts.map((a) => `${a.game}:${a.accountId}`).join(",")}`;
  const cached = getCached<GameRank[]>(cacheKey);
  if (cached) return cached;

  const results: GameRank[] = [];

  for (const account of linkedAccounts) {
    const adapter = adapters.find(
      (a) => a.gameSlug === account.game || a.game.toLowerCase() === account.game.toLowerCase()
    );
    if (!adapter) continue;

    try {
      const rank = await adapter.fetchRank(account.accountId);
      if (rank) results.push(rank);
    } catch (error) {
      logger.error("Failed to fetch rank", { game: account.game, error });
    }
  }

  setCache(cacheKey, results);
  return results;
}
