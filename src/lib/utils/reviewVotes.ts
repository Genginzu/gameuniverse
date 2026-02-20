import type { ReviewVoteCounts, VoteType } from "../../types/review";

/**
 * Détermine le nouveau vote après un clic sur un bouton.
 * Si le vote actuel est le même que le clic → null (toggle off).
 * Sinon → le nouveau type de vote.
 */
export function resolveVoteAfterClick(
  currentVote: VoteType | null,
  clickedType: VoteType
): VoteType | null {
  return currentVote === clickedType ? null : clickedType;
}

/**
 * Calcule les nouveaux compteurs après un changement de vote.
 * Décrémente l'ancien type (si non-null), incrémente le nouveau type (si non-null).
 * Les compteurs ne descendent jamais en dessous de zéro.
 */
export function computeVoteCountsAfterChange(
  currentCounts: ReviewVoteCounts,
  previousVote: VoteType | null,
  newVote: VoteType | null
): ReviewVoteCounts {
  const counts = { ...currentCounts };

  if (previousVote === "helpful") {
    counts.helpful = Math.max(0, counts.helpful - 1);
  } else if (previousVote === "not_helpful") {
    counts.notHelpful = Math.max(0, counts.notHelpful - 1);
  }

  if (newVote === "helpful") {
    counts.helpful += 1;
  } else if (newVote === "not_helpful") {
    counts.notHelpful += 1;
  }

  return counts;
}
