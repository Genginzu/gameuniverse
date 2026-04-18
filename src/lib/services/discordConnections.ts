import type { GamingPlatform } from "@/types/linked-platforms";

export interface DiscordConnection {
  type: string;
  id: string;
  name: string;
  verified?: boolean;
}

/**
 * Map Discord connection `type` (as returned by the /users/@me/connections
 * endpoint) to our internal GamingPlatform identifier. Unsupported types
 * (like twitter, reddit) return null.
 */
export function discordConnectionToPlatform(type: string): GamingPlatform | null {
  switch (type) {
    case "steam":
      return "steam";
    case "xbox":
      return "xbox";
    case "playstation":
      return "playstation";
    case "epicgames":
      return "epic";
    case "battlenet":
      return "battlenet";
    case "ubisoft":
      return "ubisoft";
    case "ea":
      return "ea";
    case "gog":
      return "gog";
    case "itch":
      return "itch";
    default:
      return null;
  }
}

export interface DiscordPlatformSuggestion {
  platform: GamingPlatform;
  username: string;
  verified: boolean;
}

/**
 * Filter Discord connections to those we recognize as gaming platforms, and
 * drop the ones the player has already linked locally.
 */
export function buildSuggestionsFromDiscord(
  connections: DiscordConnection[],
  alreadyLinked: Iterable<GamingPlatform>
): DiscordPlatformSuggestion[] {
  const linkedSet = new Set(alreadyLinked);
  const seen = new Set<GamingPlatform>();
  const out: DiscordPlatformSuggestion[] = [];

  for (const conn of connections) {
    const platform = discordConnectionToPlatform(conn.type);
    if (!platform) continue;
    if (linkedSet.has(platform)) continue;
    if (seen.has(platform)) continue;
    seen.add(platform);
    out.push({
      platform,
      username: conn.name,
      verified: Boolean(conn.verified),
    });
  }

  return out;
}
