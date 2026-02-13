import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { playerPlaytimeSchema } from "@/lib/validations/player-playtime";
import { computePlaytimeAverage } from "@/lib/services/player-playtime-utils";
import type {
  PlayerPlaytimeEntry,
  PlayerPlaytimeContributor,
} from "@/types/game";

/**
 * Resolve a game slug to its id. Returns the game id or null.
 */
async function resolveGameId(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data.id;
}

/** Parse a DB playtime value to number | null */
function parsePlaytime(val: unknown): number | null {
  const n = Number(val);
  return n > 0 ? n : null;
}

/** Check if a row has at least one playtime value */
function hasAnyPlaytime(row: {
  play_time_hastily: unknown;
  play_time_normally: unknown;
  play_time_completely: unknown;
}): boolean {
  return (
    Number(row.play_time_hastily) > 0 ||
    Number(row.play_time_normally) > 0 ||
    Number(row.play_time_completely) > 0
  );
}

/**
 * Fetch aggregated player playtime stats + individual contributors.
 */
async function fetchPlaytimeStats(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  gameId: string,
  userId: string | null
) {
  // Join user_library with profiles to get username/avatar
  const { data: entries, error } = await supabase
    .from("user_library")
    .select(
      "user_id, play_time_hastily, play_time_normally, play_time_completely, profiles(username, avatar_url)"
    )
    .eq("game_id", gameId);

  if (error) {
    throw new Error("Failed to fetch playtime stats");
  }

  const rows = (entries ?? []) as Array<{
    user_id: string;
    play_time_hastily: unknown;
    play_time_normally: unknown;
    play_time_completely: unknown;
    profiles: { username: string | null; avatar_url: string | null } | null;
  }>;

  const activeRows = rows.filter(hasAnyPlaytime);

  // Compute averages per field
  const hastilyValues = activeRows
    .map((e) => Number(e.play_time_hastily))
    .filter((v) => v > 0);
  const normallyValues = activeRows
    .map((e) => Number(e.play_time_normally))
    .filter((v) => v > 0);
  const completelyValues = activeRows
    .map((e) => Number(e.play_time_completely))
    .filter((v) => v > 0);

  const averages: PlayerPlaytimeEntry = {
    hastily: computePlaytimeAverage(hastilyValues).average,
    normally: computePlaytimeAverage(normallyValues).average,
    completely: computePlaytimeAverage(completelyValues).average,
  };

  // Build contributors list
  const contributors: PlayerPlaytimeContributor[] = activeRows.map((row) => ({
    userId: row.user_id,
    username: row.profiles?.username ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    playtime: {
      hastily: parsePlaytime(row.play_time_hastily),
      normally: parsePlaytime(row.play_time_normally),
      completely: parsePlaytime(row.play_time_completely),
    },
  }));

  // Current user's playtime
  let userPlaytime: PlayerPlaytimeEntry | null = null;
  if (userId) {
    const match = activeRows.find((e) => e.user_id === userId);
    if (match) {
      userPlaytime = {
        hastily: parsePlaytime(match.play_time_hastily),
        normally: parsePlaytime(match.play_time_normally),
        completely: parsePlaytime(match.play_time_completely),
      };
    }
  }

  return {
    averages,
    count: activeRows.length,
    userPlaytime,
    contributors,
  };
}

/**
 * GET /api/games/[slug]/playtime
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Game slug is required" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    const gameId = await resolveGameId(supabase, slug);
    if (!gameId) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const stats = await fetchPlaytimeStats(supabase, gameId, user?.id ?? null);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching player playtime stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games/[slug]/playtime
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Game slug is required" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = playerPlaytimeSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { playTimeHastily, playTimeNormally, playTimeCompletely } =
      parsed.data;

    const gameId = await resolveGameId(supabase, slug);
    if (!gameId) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const updateFields: Record<string, number | null> = {};
    if (playTimeHastily !== undefined)
      updateFields.play_time_hastily = playTimeHastily ?? null;
    if (playTimeNormally !== undefined)
      updateFields.play_time_normally = playTimeNormally ?? null;
    if (playTimeCompletely !== undefined)
      updateFields.play_time_completely = playTimeCompletely ?? null;

    const { data: existing } = await supabase
      .from("user_library")
      .select("id")
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("user_library")
        .update(updateFields)
        .eq("user_id", user.id)
        .eq("game_id", gameId);

      if (updateError) {
        console.error("Failed to update playtime:", updateError);
        return NextResponse.json(
          { error: "Failed to update playtime" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("user_library")
        .insert({
          user_id: user.id,
          game_id: gameId,
          status: "playing",
          ...updateFields,
        });

      if (insertError) {
        if (insertError.code === "PGRST205") {
          return NextResponse.json(
            { error: "Feature not available" },
            { status: 503 }
          );
        }
        console.error("Failed to insert playtime:", insertError);
        return NextResponse.json(
          { error: "Failed to save playtime" },
          { status: 500 }
        );
      }
    }

    const stats = await fetchPlaytimeStats(supabase, gameId, user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error submitting player playtime:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
