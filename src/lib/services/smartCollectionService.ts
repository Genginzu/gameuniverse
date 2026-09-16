import type {
  CollectionSuggestion,
  LibrarySuggestionGame,
  SuggestedGamePreview,
  SuggestionOptions,
} from "@/types/smartCollection";

/** Default thresholds for the suggestion engine. */
export const DEFAULT_SUGGESTION_OPTIONS: Required<SuggestionOptions> = {
  minGames: 3,
  maxGenreSuggestions: 4,
  shortDurationHours: 10,
  longDurationHours: 40,
  topRatingThreshold: 85,
  maxSuggestions: 8,
  excludeGameIds: [],
};

const MAX_PREVIEW = 4;

/** Build up to 4 previews, preferring games that have a cover image. */
function buildPreviews(games: LibrarySuggestionGame[]): SuggestedGamePreview[] {
  const withCover = games.filter((g) => g.coverImage);
  const withoutCover = games.filter((g) => !g.coverImage);
  return [...withCover, ...withoutCover].slice(0, MAX_PREVIEW).map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    coverImage: g.coverImage,
  }));
}

/** Assemble a suggestion from a criterion, a title key/params and its games. */
function makeSuggestion(
  id: string,
  criterion: CollectionSuggestion["criterion"],
  titleKey: string,
  titleParams: Record<string, string | number>,
  games: LibrarySuggestionGame[]
): CollectionSuggestion {
  return {
    id,
    criterion,
    titleKey,
    titleParams,
    gameIds: games.map((g) => g.id),
    gamesCount: games.length,
    previewGames: buildPreviews(games),
  };
}

/** Genre suggestions: top genres by game count (owned/playing/completed). */
function genreSuggestions(
  games: LibrarySuggestionGame[],
  opts: Required<SuggestionOptions>
): CollectionSuggestion[] {
  const byGenre = new Map<string, LibrarySuggestionGame[]>();

  for (const game of games) {
    // Deduplicate genres within a single game to avoid double counting.
    for (const genre of new Set(game.genres)) {
      if (!genre) continue;
      const bucket = byGenre.get(genre) ?? [];
      bucket.push(game);
      byGenre.set(genre, bucket);
    }
  }

  return [...byGenre.entries()]
    .filter(([, list]) => list.length >= opts.minGames)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, opts.maxGenreSuggestions)
    .map(([genre, list]) =>
      makeSuggestion(`genre:${genre.toLowerCase()}`, "genre", "genre", { genre }, list)
    );
}

/** Completion-year suggestions: completed games grouped by year added. */
function completionYearSuggestions(
  games: LibrarySuggestionGame[],
  opts: Required<SuggestionOptions>
): CollectionSuggestion[] {
  const completed = games.filter((g) => g.status === "completed");
  const byYear = new Map<number, LibrarySuggestionGame[]>();

  for (const game of completed) {
    const year = new Date(game.addedAt).getFullYear();
    if (Number.isNaN(year)) continue;
    const bucket = byYear.get(year) ?? [];
    bucket.push(game);
    byYear.set(year, bucket);
  }

  return [...byYear.entries()]
    .filter(([, list]) => list.length >= opts.minGames)
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) =>
      makeSuggestion(`completionYear:${year}`, "completionYear", "completionYear", { year }, list)
    );
}

/** Duration suggestions: short (<= threshold) and long (>= threshold) games. */
function durationSuggestions(
  games: LibrarySuggestionGame[],
  opts: Required<SuggestionOptions>
): CollectionSuggestion[] {
  const withTime = games.filter((g) => typeof g.playTimeHours === "number" && g.playTimeHours! > 0);

  const short = withTime.filter((g) => g.playTimeHours! <= opts.shortDurationHours);
  const long = withTime.filter((g) => g.playTimeHours! >= opts.longDurationHours);

  const result: CollectionSuggestion[] = [];
  if (short.length >= opts.minGames) {
    result.push(
      makeSuggestion(
        `duration:short:${opts.shortDurationHours}`,
        "duration",
        "durationShort",
        { hours: opts.shortDurationHours },
        short
      )
    );
  }
  if (long.length >= opts.minGames) {
    result.push(
      makeSuggestion(
        `duration:long:${opts.longDurationHours}`,
        "duration",
        "durationLong",
        { hours: opts.longDurationHours },
        long
      )
    );
  }
  return result;
}

/** Platform suggestions: games grouped by their import source platform. */
function platformSuggestions(
  games: LibrarySuggestionGame[],
  opts: Required<SuggestionOptions>
): CollectionSuggestion[] {
  const byPlatform = new Map<string, LibrarySuggestionGame[]>();

  for (const game of games) {
    const platform = game.sourcePlatform;
    if (!platform || platform === "manual") continue;
    const bucket = byPlatform.get(platform) ?? [];
    bucket.push(game);
    byPlatform.set(platform, bucket);
  }

  return [...byPlatform.entries()]
    .filter(([, list]) => list.length >= opts.minGames)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([platform, list]) =>
      makeSuggestion(`platform:${platform}`, "platform", "platform", { platform }, list)
    );
}

/** Rating suggestion: highly rated games (metascore >= threshold). */
function ratingSuggestions(
  games: LibrarySuggestionGame[],
  opts: Required<SuggestionOptions>
): CollectionSuggestion[] {
  const topRated = games
    .filter((g) => typeof g.metascore === "number" && g.metascore! >= opts.topRatingThreshold)
    .sort((a, b) => (b.metascore ?? 0) - (a.metascore ?? 0));

  if (topRated.length < opts.minGames) return [];

  return [
    makeSuggestion(
      `rating:top:${opts.topRatingThreshold}`,
      "rating",
      "rating",
      { score: opts.topRatingThreshold },
      topRated
    ),
  ];
}

/**
 * Analyze a player's library and produce collection suggestions.
 *
 * Pure and deterministic: the same library always yields the same ordered
 * suggestions. Criteria: dominant genres, completion year, playtime duration,
 * origin platform and critics rating. Suggestions with fewer than
 * `minGames` matches are dropped, and the list is capped at `maxSuggestions`.
 *
 * Note: `user_library` has no completion date, so completion-year buckets use
 * the year the completed game was added as a proxy.
 */
export function generateSuggestions(
  games: LibrarySuggestionGame[],
  options: SuggestionOptions = {}
): CollectionSuggestion[] {
  const opts = { ...DEFAULT_SUGGESTION_OPTIONS, ...options };
  if (!Array.isArray(games) || games.length === 0) return [];

  // Exclude wishlist entries (not owned) and games already placed in a
  // collection, so we never re-propose an existing or duplicate collection.
  const excluded = new Set(opts.excludeGameIds);
  const owned = games.filter((g) => g.status !== "wishlist" && !excluded.has(g.id));

  const suggestions: CollectionSuggestion[] = [
    ...genreSuggestions(owned, opts),
    ...completionYearSuggestions(owned, opts),
    ...durationSuggestions(owned, opts),
    ...platformSuggestions(owned, opts),
    ...ratingSuggestions(owned, opts),
  ];

  // Order by relevance (game count desc) while keeping deterministic ties.
  return suggestions
    .sort((a, b) => b.gamesCount - a.gamesCount || a.id.localeCompare(b.id))
    .slice(0, opts.maxSuggestions);
}
