export interface Review {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerAvatar: string | null;
}

export type VoteType = "helpful" | "not_helpful";

export interface ReviewVoteCounts {
  helpful: number;
  notHelpful: number;
}

export interface ReviewWithVotes extends Review {
  voteCounts: ReviewVoteCounts;
  userVote: VoteType | null;
}

export interface ReviewFormData {
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
}

export interface ReviewsResponse {
  reviews: ReviewWithVotes[];
  averageRating: number | null;
  totalCount: number;
  userHasReviewed: boolean;
  userReview?: Review;
}
