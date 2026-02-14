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

export interface ReviewFormData {
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  totalCount: number;
  userHasReviewed: boolean;
}
