import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { reviewVoted } from "@/lib/services/notifications";
import type { VoteType } from "@/types/review";
import { logger } from "@/lib/logger";
import { defineRoute, forbidden, notFound, validationError } from "@/lib/api/route";

interface ExistingVoteRow {
  id: string;
  vote_type: string;
}

const VALID_VOTE_TYPES: VoteType[] = ["helpful", "not_helpful"];

const voteBodySchema = z.looseObject({
  reviewId: z.unknown().optional(),
  voteType: z.unknown().optional(),
});
const deleteVoteBodySchema = z.looseObject({ reviewId: z.unknown().optional() });

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
export const POST = defineRoute(
  { auth: "required", rateLimit: "vote", body: voteBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { reviewId, voteType } = body;

    if (!isValidVoteType(voteType)) {
      throw validationError(undefined, "Invalid vote type");
    }

    if (!reviewId || typeof reviewId !== "string") {
      throw validationError(undefined, "Invalid vote type");
    }

    // Check that the review exists and get its author
    const { data: review, error: reviewError } = await supabase
      .from("game_reviews")
      .select("id, user_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) throw notFound("Review not found");

    // Prevent voting on own review
    if (review.user_id === user.id) throw forbidden("Cannot vote on own review");

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
        logger.error("Error deleting vote", { error: deleteError });
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
        logger.error("Error updating vote", { error: updateError });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    } else {
      const { error: insertError } = await untypedTable(supabase, "review_votes").insert({
        user_id: user.id,
        review_id: reviewId,
        vote_type: voteType,
      });

      if (insertError) {
        logger.error("Error inserting vote", { error: insertError });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      // An anonymised review (author deleted) has nobody to notify.
      if (review.user_id) {
        await reviewVoted({ reviewId, voterId: user.id, authorId: review.user_id, voteType });
      }
    }

    return NextResponse.json({ success: true, vote: { voteType } });
  }
);

/**
 * DELETE /api/review-votes
 *
 * Supprimer le vote de l'utilisateur courant sur une review.
 */
export const DELETE = defineRoute(
  { auth: "required", body: deleteVoteBodySchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { reviewId } = body;

    if (!reviewId || typeof reviewId !== "string") throw notFound("Review not found");

    const { error: deleteError } = await untypedTable(supabase, "review_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("review_id", reviewId);

    if (deleteError) {
      logger.error("Error deleting vote", { error: deleteError });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);
