import { IGDBService } from "./igdbService";
import { logger } from "@/lib/logger";

/**
 * IGDB `external_game_source` ids (formerly the `external_games.category`
 * enum, deprecated Feb 2026 and removed Aug 2026 — the numeric ids are
 * unchanged, only the field name moved to `external_game_source`).
 * See https://api-docs.igdb.com/#external-game-enums
 */
export const EXTERNAL_GAME_CATEGORY = {
  STEAM: 1,
  GOG: 5,
  YOUTUBE: 10,
  MICROSOFT: 11,
  APPLE: 13,
  TWITCH: 14,
  ANDROID: 15,
  AMAZON_ASIN: 20,
  AMAZON_LUNA: 22,
  AMAZON_ADG: 23,
  EPIC_GAMES_STORE: 26,
  OCULUS: 28,
  UTOMIK: 29,
  ITCH_IO: 30,
  XBOX_MARKETPLACE: 31,
  KARTRIDGE: 32,
  PLAYSTATION_STORE_US: 36,
  FOCUS_ENTERTAINMENT: 37,
  XBOX_GAME_PASS_ULTIMATE_CLOUD: 54,
  GAMEJOLT: 55,
} as const;

export type ExternalGameCategory =
  (typeof EXTERNAL_GAME_CATEGORY)[keyof typeof EXTERNAL_GAME_CATEGORY];

interface ExternalGameRow {
  uid: string;
  game: number;
}

const BATCH_SIZE = 200;

/**
 * Resolve a list of external platform ids (Steam appid, GOG id, …) to IGDB game ids,
 * via IGDB's `external_games` endpoint.
 *
 * Returned map is keyed by the external uid (as string, since IGDB stores it that way).
 */
export async function resolveIgdbIdsByExternalUids(
  uids: Array<string | number>,
  category: ExternalGameCategory
): Promise<Map<string, number>> {
  const unique = Array.from(new Set(uids.map((u) => String(u)))).filter(Boolean);
  const result = new Map<string, number>();
  if (unique.length === 0) return result;

  const quoted = (value: string) => `"${value.replace(/"/g, '\\"')}"`;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const body = `fields uid, game;
where external_game_source = ${category} & uid = (${batch.map(quoted).join(",")});
limit ${BATCH_SIZE};`;

    const rows = await callExternalGames(body);
    for (const row of rows) {
      if (row.uid && row.game) result.set(row.uid, row.game);
    }
  }

  return result;
}

async function callExternalGames(body: string): Promise<ExternalGameRow[]> {
  // Expose the internal fetch via a public query method.
  const response = await IGDBService.rawQuery("external_games", body);
  if (!response.ok) {
    const text = await response.text();
    logger.error("IGDB external_games query failed", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    // Surface the failure instead of silently returning no matches — a silent
    // empty result makes a broken query look like "0 games matched".
    throw new Error(`IGDB external_games query failed (${response.status}): ${text.slice(0, 200)}`);
  }
  return (await response.json()) as ExternalGameRow[];
}
