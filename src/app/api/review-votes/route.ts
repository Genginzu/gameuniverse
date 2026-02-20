import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { VoteType } from "@/types/review";

interface ExistingVoteRow {
  id: string;
  vote_type: string;
}

const VALID_VOTE_TYPES: VoteType[] = ["helpful", "not_helpful"];

function isValidVoteType(value: unknown): value is VoteType {
  return typeof value === "string" && VALID_VOTE_TYPES.includes(value as VoteType);
}

/**
 * POST /api/review-votes
 *
 * Créer, modifier ou supprimer (toggle) un vote sur une review.
 * - Si aucun vote n'existe → crée le vote
 * - Si un vote existe avec un type différent → met à jour le type
 * - Si un vote existe avec le même type → supprime le vote (toggle off)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, voteType } = body;

    if (!isValidVoteType(voteType)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // Check that the review exists and get its author
    const { data: review, error: reviewError } = await supabase
      .from("game_reviews")
      .select("id, user_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Prevent voting on own review
    if (review.user_id === user.id) {
      return NextResponse.json({ error: "Cannot vote on own review" }, { status: 403 });
    }

    // Check for existing vote
    const { data: existingVoteData } = await untypedTable(supabase, "review_votes")
      .select("id, vote_type")
      .eq("user_id", user.id)
      .eq("review_id", reviewId)
      .single();

    const existingVote = existingVoteData as ExistingVoteRow | null;

    // Toggle: same vote type → delete
    if (existingVote && existingVote.vote_type === voteType) {
      const { error: deleteError } = await untypedTable(supabase, "review_votes")
        .delete()
        .eq("id", existingVote.id);

      if (deleteError) {
        console.error("Error deleting vote:", deleteError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      return NextResponse.json({ success: true, vote: null });
    }

    // Upsert: create or update vote
    if (existingVote) {
      const { error: updateError } = await untypedTable(supabase, "review_votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id);

      if (updateError) {
        console.error("Error updating vote:", updateError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    } else {
      const { error: insertError } = await untypedTable(supabase, "review_votes").insert({
        user_id: user.id,
        review_id: reviewId,
        vote_type: voteType,
      });

      if (insertError) {
        console.error("Error inserting vote:", insertError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, vote: { voteType } });
  } catch (error) {
    console.error("Error in review-votes POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/review-votes
 *
 * Supprimer le vote de l'utilisateur courant sur une review.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { error: deleteError } = await untypedTable(supabase, "review_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("review_id", reviewId);

    if (deleteError) {
      console.error("Error deleting vote:", deleteError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in review-votes DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
