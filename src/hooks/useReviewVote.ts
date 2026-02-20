"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { ReviewVoteCounts, VoteType } from "@/types/review";
import { resolveVoteAfterClick, computeVoteCountsAfterChange } from "@/lib/utils/reviewVotes";
import { ReviewVoteService } from "@/lib/services/reviewVoteService";

export interface UseReviewVoteReturn {
  voteCounts: ReviewVoteCounts;
  userVote: VoteType | null;
  isVoting: boolean;
  error: string | null;
  handleVote: (voteType: VoteType) => Promise<void>;
}

/**
 * Hook pour gérer le vote sur une review.
 * Reçoit les données initiales du parent (pas de fetch au mount).
 * Gère la mise à jour optimiste et le rollback en cas d'erreur.
 */
export function useReviewVote(
  reviewId: string,
  reviewUserId: string,
  initialCounts: ReviewVoteCounts,
  initialUserVote: VoteType | null
): UseReviewVoteReturn {
  const { user } = useAuth();
  const [voteCounts, setVoteCounts] = useState<ReviewVoteCounts>(initialCounts);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = useCallback(
    async (voteType: VoteType) => {
      if (!user || isVoting) return;

      // Blocage du vote sur sa propre review
      if (user.id === reviewUserId) return;

      const prevVote = userVote;
      const prevCounts = voteCounts;
      const newVote = resolveVoteAfterClick(userVote, voteType);
      const newCounts = computeVoteCountsAfterChange(voteCounts, userVote, newVote);

      // Mise à jour optimiste
      setUserVote(newVote);
      setVoteCounts(newCounts);
      setIsVoting(true);
      setError(null);

      try {
        if (newVote === null) {
          await ReviewVoteService.removeVote(reviewId);
        } else {
          await ReviewVoteService.submitVote(reviewId, newVote);
        }
      } catch (err) {
        // Rollback en cas d'erreur
        setUserVote(prevVote);
        setVoteCounts(prevCounts);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsVoting(false);
      }
    },
    [user, reviewUserId, reviewId, userVote, voteCounts, isVoting]
  );

  return { voteCounts, userVote, isVoting, error, handleVote };
}
