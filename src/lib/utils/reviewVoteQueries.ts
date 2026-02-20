import type { createRouteHandlerClient } from "@/lib/supabase-server";
import type { ReviewVoteCounts, VoteType, Review, ReviewWithVotes } from "@/types/review";

interface VoteRow {
  review_id: string;
  vote_type: string;
}

/**
 * Fetch aggregated vote counts for a list of review IDs.
 * Returns a Map keyed by review_id for O(1) lookup.
 */
export async function fetchVoteCountsMap(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  reviewIds: string[]
): Promise<Map<string, ReviewVoteCounts>> {
  const map = new Map<string, ReviewVoteCounts>();
  if (reviewIds.length === 0) return map;

  const { data, error } = await supabase
    .from("review_votes" as any)
    .select("review_id, vote_type")
    .in("review_id", reviewIds);

  if (error || !data) return map;

  for (const row of data as unknown as VoteRow[]) {
    const existing = map.get(row.review_id) ?? { helpful: 0, notHelpful: 0 };
    if (row.vote_type === "helpful") {
      existing.helpful += 1;
    } else if (row.vote_type === "not_helpful") {
      existing.notHelpful += 1;
    }
    map.set(row.review_id, existing);
  }

  return map;
}

/**
 * Fetch the current user's votes for a list of review IDs.
 * Returns a Map keyed by review_id → VoteType.
 */
export async function fetchUserVotesMap(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
  reviewIds: string[]
): Promise<Map<string, VoteType>> {
  const map = new Map<string, VoteType>();
  if (reviewIds.length === 0) return map;

  const { data, error } = await supabase
    .from("review_votes" as any)
    .select("review_id, vote_type")
    .eq("user_id", userId)
    .in("review_id", reviewIds);

  if (error || !data) return map;

  for (const row of data as unknown as VoteRow[]) {
    map.set(row.review_id, row.vote_type as VoteType);
  }

  return map;
}

/**
 * Enrich reviews with vote counts and the current user's vote.
 * Pure transformation — no side effects.
 */
export function enrichReviewsWithVotes(
  reviews: Review[],
  voteCountsMap: Map<string, ReviewVoteCounts>,
  userVotesMap: Map<string, VoteType>
): ReviewWithVotes[] {
  return reviews.map((review) => ({
    ...review,
    voteCounts: voteCountsMap.get(review.id) ?? { helpful: 0, notHelpful: 0 },
    userVote: userVotesMap.get(review.id) ?? null,
  }));
}
